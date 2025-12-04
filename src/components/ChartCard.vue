<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { NCard } from 'naive-ui'
import * as echarts from 'echarts'
import { useResponsive } from '../composables/useResponsive'
import { useDebounceFn } from '@vueuse/core'

interface HistoryData {
  record_date: string
  sugar_close: number
  bdi_index: number
}

interface Props {
  data: HistoryData[]
}

const props = defineProps<Props>()

const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

const { isMobile, isTablet, isDesktop } = useResponsive()

const chartHeight = computed(() => {
  if (isDesktop.value) return '600px'
  if (isTablet.value) return '400px'
  return '300px'
})

const renderChart = () => {
  if (!chartRef.value || props.data.length === 0) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const dates = props.data.map(d => d.record_date).reverse()
  const sugar = props.data.map(d => d.sugar_close).reverse()
  const bdi = props.data.map(d => d.bdi_index).reverse()

  chartInstance.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E5E5EA',
      borderWidth: 1,
      textStyle: {
        color: '#1D1D1F',
        fontSize: 12
      },
      axisPointer: {
        type: 'cross',
        lineStyle: {
          color: '#86868B',
          type: 'dashed'
        }
      }
    },
    legend: {
      data: ['郑糖价格', 'BDI指数'],
      textStyle: { 
        color: '#1D1D1F',
        fontSize: 14
      },
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
      axisLabel: {
        color: '#86868B',
        rotate: 45,
        fontSize: 12
      },
      axisLine: { 
        lineStyle: { color: '#E5E5EA' } 
      },
      splitLine: {
        show: false
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '郑糖价格 (元/吨)',
        position: 'left',
        axisLabel: { 
          color: '#86868B',
          fontSize: 12
        },
        axisLine: { 
          show: true,
          lineStyle: { color: '#007AFF' } 
        },
        splitLine: {
          lineStyle: {
            color: '#F5F5F7',
            type: 'dashed'
          }
        },
        nameTextStyle: { 
          color: '#1D1D1F',
          fontSize: 14
        }
      },
      {
        type: 'value',
        name: 'BDI指数',
        position: 'right',
        axisLabel: { 
          color: '#86868B',
          fontSize: 12
        },
        axisLine: { 
          show: true,
          lineStyle: { color: '#FF9500' } 
        },
        splitLine: {
          show: false
        },
        nameTextStyle: { 
          color: '#1D1D1F',
          fontSize: 14
        }
      }
    ],
    series: [
      {
        name: '郑糖价格',
        type: 'line',
        data: sugar,
        yAxisIndex: 0,
        smooth: true,
        lineStyle: { 
          color: '#007AFF', 
          width: 3 
        },
        itemStyle: { 
          color: '#007AFF',
          borderWidth: 2,
          borderColor: '#FFFFFF'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 122, 255, 0.2)' },
              { offset: 1, color: 'rgba(0, 122, 255, 0.02)' }
            ]
          }
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            borderWidth: 3
          }
        }
      },
      {
        name: 'BDI指数',
        type: 'bar',
        data: bdi,
        yAxisIndex: 1,
        itemStyle: { 
          color: '#FF9500',
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '50%',
        emphasis: {
          focus: 'series',
          itemStyle: {
            color: '#FF9500',
            shadowBlur: 10,
            shadowColor: 'rgba(255, 149, 0, 0.3)'
          }
        }
      }
    ]
  })
}

const handleResize = useDebounceFn(() => {
  chartInstance?.resize()
}, 200)

watch(() => props.data, renderChart, { deep: true })

onMounted(() => {
  renderChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<template>
  <NCard 
    :bordered="true" 
    style="border: 1px solid #E5E5EA; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); border-radius: 12px;"
  >
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-size: 20px; color: #1D1D1F; font-weight: 600; margin-bottom: 4px;">
            历史趋势分析
          </div>
          <div style="font-size: 14px; color: #86868B; font-weight: 400;">
            郑糖价格与BDI指数变化趋势
          </div>
        </div>
        <div style="font-size: 14px; color: #86868B; font-weight: 400;">
          2020-01 - 2024-12
        </div>
      </div>
    </template>
    
    <div ref="chartRef" :style="{ height: chartHeight, width: '100%' }"></div>
  </NCard>
</template>
