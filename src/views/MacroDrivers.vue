<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { NGrid, NGridItem, NCard, NSpin } from 'naive-ui'
import * as echarts from 'echarts'
import { useMarketData } from '../composables/useMarketData'
import { calculateCorrelation, getCorrelationStrength, normalizeData, linearRegression } from '../utils/calculations'
import MetricCard from '../components/MetricCard.vue'

const { history, loading, fetchData } = useMarketData()

// 图表实例
const normalizedChartRef = ref<HTMLDivElement>()
const scatterChartRef = ref<HTMLDivElement>()
let normalizedChartInstance: echarts.ECharts | null = null
let scatterChartInstance: echarts.ECharts | null = null

// 计算相关系数
const correlations = computed(() => {
  if (history.value.length < 2) {
    return {
      sugarUSD: 0,
      sugarBDI: 0,
      usdCost: 0
    }
  }
  
  const sugarPrices = history.value.map(d => d.sugar_close)
  const usdRates = history.value.map(d => d.usd_cny_rate)
  const bdiValues = history.value.map(d => d.bdi_index)
  const importCosts = history.value.map(d => d.import_cost_estimate)
  
  return {
    sugarUSD: calculateCorrelation(sugarPrices, usdRates),
    sugarBDI: calculateCorrelation(sugarPrices, bdiValues),
    usdCost: calculateCorrelation(usdRates, importCosts)
  }
})

// 相关系数指标
const correlationMetrics = computed(() => {
  const { sugarUSD, sugarBDI, usdCost } = correlations.value
  
  return [
    {
      title: '糖价-汇率相关性',
      value: sugarUSD,
      suffix: '',
      ...getCorrelationStrength(sugarUSD)
    },
    {
      title: '糖价-BDI相关性',
      value: sugarBDI,
      suffix: '',
      ...getCorrelationStrength(sugarBDI)
    },
    {
      title: '汇率-成本相关性',
      value: usdCost,
      suffix: '',
      ...getCorrelationStrength(usdCost)
    }
  ]
})

// 归一化数据
const normalizedData = computed(() => {
  if (history.value.length === 0) return null
  
  const sugarPrices = history.value.map(d => d.sugar_close)
  const usdRates = history.value.map(d => d.usd_cny_rate)
  const bdiValues = history.value.map(d => d.bdi_index)
  
  return {
    sugar: normalizeData(sugarPrices),
    usd: normalizeData(usdRates),
    bdi: normalizeData(bdiValues)
  }
})

// 渲染归一化趋势图
const renderNormalizedChart = () => {
  if (!normalizedChartRef.value || !normalizedData.value || history.value.length === 0) return
  
  if (!normalizedChartInstance) {
    normalizedChartInstance = echarts.init(normalizedChartRef.value)
  }
  
  const dates = history.value.map(d => d.record_date).reverse()
  const sugar = normalizedData.value.sugar.slice().reverse()
  const usd = normalizedData.value.usd.slice().reverse()
  const bdi = normalizedData.value.bdi.slice().reverse()
  
  normalizedChartInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E5E5EA',
      borderWidth: 1,
      textStyle: { color: '#1D1D1F', fontSize: 12 },
      formatter: (params: any) => {
        const date = params[0].axisValue
        let result = `<div style="padding: 4px;"><div style="font-weight: 600; margin-bottom: 4px;">${date}</div>`
        params.forEach((param: any) => {
          const change = param.value - 100
          result += `<div>${param.seriesName}: ${param.value.toFixed(1)}% `
          result += `<span style="color: ${change >= 0 ? '#34C759' : '#FF3B30'};">`
          result += `(${change > 0 ? '+' : ''}${change.toFixed(1)}%)</span></div>`
        })
        result += '</div>'
        return result
      }
    },
    legend: {
      data: ['郑糖价格', '美元汇率', 'BDI指数'],
      textStyle: { color: '#1D1D1F', fontSize: 14 },
      top: 10,
      itemGap: 20
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { color: '#86868B', fontSize: 12, rotate: 45 },
      axisLine: { lineStyle: { color: '#E5E5EA' } }
    },
    yAxis: {
      type: 'value',
      name: '相对变化 (%)',
      axisLabel: { 
        color: '#86868B', 
        fontSize: 12,
        formatter: '{value}%'
      },
      axisLine: { lineStyle: { color: '#E5E5EA' } },
      splitLine: { lineStyle: { color: '#F5F5F7', type: 'dashed' } },
      nameTextStyle: { color: '#1D1D1F', fontSize: 14 }
    },
    series: [
      {
        name: '郑糖价格',
        type: 'line',
        data: sugar,
        smooth: true,
        lineStyle: { color: '#007AFF', width: 3 },
        itemStyle: { color: '#007AFF' },
        emphasis: { focus: 'series' }
      },
      {
        name: '美元汇率',
        type: 'line',
        data: usd,
        smooth: true,
        lineStyle: { color: '#34C759', width: 3 },
        itemStyle: { color: '#34C759' },
        emphasis: { focus: 'series' }
      },
      {
        name: 'BDI指数',
        type: 'line',
        data: bdi,
        smooth: true,
        lineStyle: { color: '#FF9500', width: 3 },
        itemStyle: { color: '#FF9500' },
        emphasis: { focus: 'series' }
      }
    ]
  })
}

// 渲染散点回归图
const renderScatterChart = () => {
  if (!scatterChartRef.value || history.value.length === 0) return
  
  if (!scatterChartInstance) {
    scatterChartInstance = echarts.init(scatterChartRef.value)
  }
  
  const usdRates = history.value.map(d => d.usd_cny_rate)
  const importCosts = history.value.map(d => d.import_cost_estimate)
  
  // 散点数据
  const scatterData = usdRates.map((usd, i) => [usd, importCosts[i]])
  
  // 线性回归
  const regression = linearRegression(usdRates, importCosts)
  const minUSD = Math.min(...usdRates)
  const maxUSD = Math.max(...usdRates)
  const regressionLine = [
    [minUSD, regression.predict(minUSD)],
    [maxUSD, regression.predict(maxUSD)]
  ]
  
  scatterChartInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E5E5EA',
      borderWidth: 1,
      textStyle: { color: '#1D1D1F', fontSize: 12 },
      formatter: (params: any) => {
        if (params.seriesName === '实际数据') {
          return `
            <div style="padding: 4px;">
              <div style="font-weight: 600; margin-bottom: 4px;">实际数据点</div>
              <div>汇率: ${params.value[0].toFixed(2)}</div>
              <div>成本: ${params.value[1].toFixed(0)} 元/吨</div>
            </div>
          `
        }
        return ''
      }
    },
    xAxis: {
      type: 'value',
      name: '美元汇率 (CNY/USD)',
      scale: true,
      axisLabel: { color: '#86868B', fontSize: 12 },
      axisLine: { lineStyle: { color: '#E5E5EA' } },
      splitLine: { lineStyle: { color: '#F5F5F7', type: 'dashed' } },
      nameTextStyle: { color: '#1D1D1F', fontSize: 14 }
    },
    yAxis: {
      type: 'value',
      name: '进口成本 (元/吨)',
      scale: true,
      axisLabel: { color: '#86868B', fontSize: 12 },
      axisLine: { lineStyle: { color: '#E5E5EA' } },
      splitLine: { lineStyle: { color: '#F5F5F7', type: 'dashed' } },
      nameTextStyle: { color: '#1D1D1F', fontSize: 14 }
    },
    series: [
      {
        name: '实际数据',
        type: 'scatter',
        data: scatterData,
        symbolSize: 10,
        itemStyle: { 
          color: '#007AFF',
          opacity: 0.6
        },
        emphasis: {
          itemStyle: {
            color: '#007AFF',
            opacity: 1,
            borderWidth: 2,
            borderColor: '#FFFFFF'
          }
        }
      },
      {
        name: '回归线',
        type: 'line',
        data: regressionLine,
        lineStyle: { 
          color: '#FF3B30', 
          width: 3,
          type: 'dashed'
        },
        showSymbol: false,
        silent: true
      }
    ],
    graphic: [
      {
        type: 'text',
        left: '5%',
        top: '5%',
        style: {
          text: `R² = ${regression.r2.toFixed(3)}`,
          fontSize: 16,
          fontWeight: 600,
          fill: '#1D1D1F'
        }
      }
    ]
  })
}

// 窗口大小变化时调整图表
const handleResize = () => {
  normalizedChartInstance?.resize()
  scatterChartInstance?.resize()
}

onMounted(async () => {
  if (history.value.length === 0) {
    await fetchData()
  }
  
  await nextTick()
  renderNormalizedChart()
  renderScatterChart()
  
  window.addEventListener('resize', handleResize)
})

// 监听数据变化
watch(() => history.value, () => {
  nextTick(() => {
    renderNormalizedChart()
    renderScatterChart()
  })
}, { deep: true })
</script>

<template>
  <div>
    <NSpin :show="loading">
      <!-- 页面标题 -->
      <div style="margin-bottom: 32px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
          <span style="font-size: 32px;">📈</span>
          <h1 style="font-size: 32px; font-weight: 700; color: #1D1D1F; margin: 0;">宏观驱动力分析</h1>
        </div>
        <p style="font-size: 16px; color: #86868B; margin: 0;">
          分析价格变动的驱动因素，识别市场主要推动力
        </p>
      </div>

      <!-- 相关系数指标 -->
      <NGrid :cols="3" :x-gap="20" :y-gap="20" style="margin-bottom: 32px;">
        <NGridItem v-for="metric in correlationMetrics" :key="metric.title">
          <NCard 
            :bordered="true" 
            style="height: 160px; border: 1px solid #E5E5EA; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); border-radius: 12px;"
          >
            <div style="height: 100%; display: flex; flex-direction: column;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                <span style="font-size: 14px; color: #86868B; font-weight: 500;">{{ metric.title }}</span>
                <span 
                  :style="{ 
                    fontSize: '12px', 
                    color: metric.color, 
                    fontWeight: 600,
                    padding: '2px 8px',
                    background: `${metric.color}15`,
                    borderRadius: '4px'
                  }"
                >
                  {{ metric.strength }}
                </span>
              </div>
              <div style="flex: 1; display: flex; align-items: flex-end;">
                <span style="font-size: 48px; font-weight: 700; color: #1D1D1F; line-height: 1;">
                  {{ metric.value.toFixed(2) }}
                </span>
              </div>
              <div style="font-size: 12px; color: #86868B; margin-top: 8px;">
                {{ metric.description }}
              </div>
            </div>
          </NCard>
        </NGridItem>
      </NGrid>

      <!-- 归一化趋势对比图 -->
      <NCard 
        :bordered="true" 
        style="border: 1px solid #E5E5EA; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); border-radius: 12px; margin-bottom: 32px;"
      >
        <template #header>
          <div>
            <div style="font-size: 20px; color: #1D1D1F; font-weight: 600; margin-bottom: 4px;">
              归一化趋势对比
            </div>
            <div style="font-size: 14px; color: #86868B; font-weight: 400;">
              以第一天为基准（100%），显示各因素的相对变化趋势
            </div>
          </div>
        </template>
        <div ref="normalizedChartRef" style="height: 500px; width: 100%;"></div>
      </NCard>

      <!-- 散点回归图 -->
      <NCard 
        :bordered="true" 
        style="border: 1px solid #E5E5EA; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); border-radius: 12px;"
      >
        <template #header>
          <div>
            <div style="font-size: 20px; color: #1D1D1F; font-weight: 600; margin-bottom: 4px;">
              汇率-成本散点回归
            </div>
            <div style="font-size: 14px; color: #86868B; font-weight: 400;">
              展示美元汇率与进口成本的线性关系
            </div>
          </div>
        </template>
        <div ref="scatterChartRef" style="height: 500px; width: 100%;"></div>
      </NCard>
    </NSpin>
  </div>
</template>

