<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { NGrid, NGridItem, NCard, NSpin } from 'naive-ui'
import * as echarts from 'echarts'
import { useMarketData } from '../composables/useMarketData'
import { calculateImportCost, calculateArbitrageProfit, getArbitrageStatus, calculateProfitDistribution } from '../utils/calculations'
import MetricCard from '../components/MetricCard.vue'

const { history, loading, fetchData } = useMarketData()

// 图表实例
const spreadChartRef = ref<HTMLDivElement>()
const distributionChartRef = ref<HTMLDivElement>()
let spreadChartInstance: echarts.ECharts | null = null
let distributionChartInstance: echarts.ECharts | null = null

// 假设的 ICE 原糖价格（美分/磅）- 实际应该从 API 获取
const ICE_PRICE = 22

// 计算进口成本和利润
const arbitrageData = computed(() => {
  if (history.value.length === 0) return null
  
  const inQuotaCosts: number[] = []
  const outQuotaCosts: number[] = []
  const inQuotaProfits: number[] = []
  const outQuotaProfits: number[] = []
  
  history.value.forEach(d => {
    // 配额内进口成本（15% 关税）
    const inQuotaCost = calculateImportCost({
      icePrice: ICE_PRICE,
      usdCnyRate: d.usd_cny_rate,
      bdiIndex: d.bdi_index,
      tariffRate: 0.15
    })
    inQuotaCosts.push(inQuotaCost)
    
    // 配额外进口成本（50% 关税）
    const outQuotaCost = calculateImportCost({
      icePrice: ICE_PRICE,
      usdCnyRate: d.usd_cny_rate,
      bdiIndex: d.bdi_index,
      tariffRate: 0.50
    })
    outQuotaCosts.push(outQuotaCost)
    
    // 计算利润
    inQuotaProfits.push(calculateArbitrageProfit(d.sugar_close, inQuotaCost))
    outQuotaProfits.push(calculateArbitrageProfit(d.sugar_close, outQuotaCost))
  })
  
  return {
    inQuotaCosts,
    outQuotaCosts,
    inQuotaProfits,
    outQuotaProfits
  }
})

// 最新的套利指标
const latestMetrics = computed(() => {
  if (!arbitrageData.value || history.value.length === 0) {
    return {
      inQuotaProfit: 0,
      outQuotaProfit: 0,
      inQuotaStatus: getArbitrageStatus(0),
      outQuotaStatus: getArbitrageStatus(0)
    }
  }
  
  const inQuotaProfit = arbitrageData.value.inQuotaProfits[0]
  const outQuotaProfit = arbitrageData.value.outQuotaProfits[0]
  
  return {
    inQuotaProfit,
    outQuotaProfit,
    inQuotaStatus: getArbitrageStatus(inQuotaProfit),
    outQuotaStatus: getArbitrageStatus(outQuotaProfit)
  }
})

// 利润分布统计
const profitStats = computed(() => {
  if (!arbitrageData.value) {
    return {
      inQuota: { profitableDays: 0, lossDays: 0, profitableRatio: 0 },
      outQuota: { profitableDays: 0, lossDays: 0, profitableRatio: 0 }
    }
  }
  
  return {
    inQuota: calculateProfitDistribution(arbitrageData.value.inQuotaProfits),
    outQuota: calculateProfitDistribution(arbitrageData.value.outQuotaProfits)
  }
})

// 渲染价差走势图
const renderSpreadChart = () => {
  if (!spreadChartRef.value || !arbitrageData.value || history.value.length === 0) return
  
  if (!spreadChartInstance) {
    spreadChartInstance = echarts.init(spreadChartRef.value)
  }
  
  const dates = history.value.map(d => d.record_date).reverse()
  const sugarPrices = history.value.map(d => d.sugar_close).reverse()
  const inQuotaCosts = arbitrageData.value.inQuotaCosts.slice().reverse()
  
  spreadChartInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E5E5EA',
      borderWidth: 1,
      textStyle: { color: '#1D1D1F', fontSize: 12 },
      formatter: (params: any) => {
        const date = params[0].axisValue
        const sugar = params[0].value
        const cost = params[1].value
        const profit = sugar - cost
        const profitColor = profit > 0 ? '#34C759' : '#FF3B30'
        return `
          <div style="padding: 4px;">
            <div style="margin-bottom: 4px; font-weight: 600;">${date}</div>
            <div>郑糖价格: ${sugar.toFixed(0)} 元/吨</div>
            <div>进口成本: ${cost.toFixed(0)} 元/吨</div>
            <div style="color: ${profitColor}; font-weight: 600;">
              利润: ${profit > 0 ? '+' : ''}${profit.toFixed(0)} 元/吨
            </div>
          </div>
        `
      }
    },
    legend: {
      data: ['郑糖价格', '配额内进口成本'],
      textStyle: { color: '#1D1D1F', fontSize: 14 },
      top: 10
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
      name: '价格 (元/吨)',
      axisLabel: { color: '#86868B', fontSize: 12 },
      axisLine: { lineStyle: { color: '#E5E5EA' } },
      splitLine: { lineStyle: { color: '#F5F5F7', type: 'dashed' } },
      nameTextStyle: { color: '#1D1D1F', fontSize: 14 }
    },
    series: [
      {
        name: '郑糖价格',
        type: 'line',
        data: sugarPrices,
        lineStyle: { color: '#007AFF', width: 3 },
        itemStyle: { color: '#007AFF' },
        smooth: true,
        z: 2
      },
      {
        name: '配额内进口成本',
        type: 'line',
        data: inQuotaCosts,
        lineStyle: { color: '#FF9500', width: 3 },
        itemStyle: { color: '#FF9500' },
        smooth: true,
        z: 2
      },
      {
        name: '利润区域',
        type: 'line',
        data: sugarPrices.map((price, i) => Math.max(price, inQuotaCosts[i])),
        lineStyle: { width: 0 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(52, 199, 89, 0.2)' },
              { offset: 1, color: 'rgba(52, 199, 89, 0.05)' }
            ]
          },
          origin: 'start'
        },
        stack: 'profit',
        silent: true,
        z: 1
      },
      {
        name: '亏损区域',
        type: 'line',
        data: inQuotaCosts.map((cost, i) => Math.max(cost, sugarPrices[i])),
        lineStyle: { width: 0 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 59, 48, 0.2)' },
              { offset: 1, color: 'rgba(255, 59, 48, 0.05)' }
            ]
          },
          origin: 'start'
        },
        stack: 'loss',
        silent: true,
        z: 1
      }
    ]
  })
}

// 渲染利润分布图
const renderDistributionChart = () => {
  if (!distributionChartRef.value || !profitStats.value) return
  
  if (!distributionChartInstance) {
    distributionChartInstance = echarts.init(distributionChartRef.value)
  }
  
  const stats = profitStats.value.inQuota
  
  distributionChartInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E5E5EA',
      borderWidth: 1,
      textStyle: { color: '#1D1D1F', fontSize: 12 },
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const item = params[0]
        const ratio = (item.value / (stats.profitableDays + stats.lossDays) * 100).toFixed(1)
        return `
          <div style="padding: 4px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${item.name}</div>
            <div>天数: ${item.value} 天</div>
            <div>占比: ${ratio}%</div>
          </div>
        `
      }
    },
    xAxis: {
      type: 'category',
      data: ['有利润', '亏损'],
      axisLabel: { color: '#86868B', fontSize: 14 },
      axisLine: { lineStyle: { color: '#E5E5EA' } }
    },
    yAxis: {
      type: 'value',
      name: '天数',
      axisLabel: { color: '#86868B', fontSize: 12 },
      axisLine: { lineStyle: { color: '#E5E5EA' } },
      splitLine: { lineStyle: { color: '#F5F5F7', type: 'dashed' } },
      nameTextStyle: { color: '#1D1D1F', fontSize: 14 }
    },
    series: [
      {
        type: 'bar',
        data: [
          { value: stats.profitableDays, itemStyle: { color: '#34C759' } },
          { value: stats.lossDays, itemStyle: { color: '#FF3B30' } }
        ],
        barWidth: '50%',
        label: {
          show: true,
          position: 'top',
          color: '#1D1D1F',
          fontSize: 14,
          fontWeight: 600
        }
      }
    ]
  })
}

// 窗口大小变化时调整图表
const handleResize = () => {
  spreadChartInstance?.resize()
  distributionChartInstance?.resize()
}

onMounted(async () => {
  if (history.value.length === 0) {
    await fetchData()
  }
  
  await nextTick()
  renderSpreadChart()
  renderDistributionChart()
  
  window.addEventListener('resize', handleResize)
})

// 监听数据变化
import { watch } from 'vue'
watch(() => history.value, () => {
  nextTick(() => {
    renderSpreadChart()
    renderDistributionChart()
  })
}, { deep: true })
</script>

<template>
  <div>
    <NSpin :show="loading">
      <!-- 页面标题 -->
      <div style="margin-bottom: 32px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
          <span style="font-size: 32px;">💰</span>
          <h1 style="font-size: 32px; font-weight: 700; color: #1D1D1F; margin: 0;">进口套利分析</h1>
        </div>
        <p style="font-size: 16px; color: #86868B; margin: 0;">
          实时监控进口套利空间，判断当前是否是进口的好时机
        </p>
      </div>

      <!-- 指标卡片 -->
      <NGrid :cols="3" :x-gap="20" :y-gap="20" style="margin-bottom: 32px;">
        <NGridItem>
          <MetricCard
            title="配额内进口利润"
            :value="latestMetrics.inQuotaProfit"
            suffix="元/吨"
          />
        </NGridItem>
        <NGridItem>
          <MetricCard
            title="配额外进口利润"
            :value="latestMetrics.outQuotaProfit"
            suffix="元/吨"
          />
        </NGridItem>
        <NGridItem>
          <NCard 
            :bordered="true" 
            style="height: 160px; border: 1px solid #E5E5EA; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); border-radius: 12px;"
          >
            <div style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
              <div style="font-size: 14px; color: #86868B; font-weight: 500; margin-bottom: 16px;">
                套利窗口状态
              </div>
              <div style="font-size: 48px; margin-bottom: 8px;">
                {{ latestMetrics.inQuotaStatus.icon }}
              </div>
              <div 
                :style="{ 
                  fontSize: '20px', 
                  fontWeight: 600, 
                  color: latestMetrics.inQuotaStatus.color 
                }"
              >
                {{ latestMetrics.inQuotaStatus.text }}
              </div>
            </div>
          </NCard>
        </NGridItem>
      </NGrid>

      <!-- 内外盘价差走势图 -->
      <NCard 
        :bordered="true" 
        style="border: 1px solid #E5E5EA; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); border-radius: 12px; margin-bottom: 32px;"
      >
        <template #header>
          <div>
            <div style="font-size: 20px; color: #1D1D1F; font-weight: 600; margin-bottom: 4px;">
              内外盘价差走势
            </div>
            <div style="font-size: 14px; color: #86868B; font-weight: 400;">
              郑糖价格与配额内进口成本对比（绿色=利润，红色=亏损）
            </div>
          </div>
        </template>
        <div ref="spreadChartRef" style="height: 500px; width: 100%;"></div>
      </NCard>

      <!-- 利润分布统计 -->
      <NCard 
        :bordered="true" 
        style="border: 1px solid #E5E5EA; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); border-radius: 12px;"
      >
        <template #header>
          <div>
            <div style="font-size: 20px; color: #1D1D1F; font-weight: 600; margin-bottom: 4px;">
              利润分布统计
            </div>
            <div style="font-size: 14px; color: #86868B; font-weight: 400;">
              过去 {{ history.length }} 天的套利窗口开启情况
            </div>
          </div>
        </template>
        <div ref="distributionChartRef" style="height: 400px; width: 100%;"></div>
      </NCard>
    </NSpin>
  </div>
</template>

