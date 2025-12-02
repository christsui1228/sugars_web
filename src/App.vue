<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NConfigProvider, NMessageProvider, darkTheme, NLayout, NLayoutHeader, NGrid, NGridItem, NCard, NStatistic, NButton } from 'naive-ui'
import axios from 'axios'
import * as echarts from 'echarts'

const loading = ref(false)
const latest = ref({ sugar_close: 0, usd_cny_rate: 0, bdi_index: 0, import_cost_estimate: 0 })
const history = ref<any[]>([])

const fetchData = async () => {
  try {
    const [latestRes, historyRes] = await Promise.all([
      axios.get('/api/market/daily?limit=1'),
      axios.get('/api/market/daily?limit=30')
    ])
    latest.value = latestRes.data[0] || {}
    history.value = historyRes.data
    renderChart()
  } catch (error) {
    window.$message?.error('数据加载失败')
  }
}

const refreshData = async () => {
  loading.value = true
  try {
    await fetchData()
    window.$message?.success('数据刷新成功')
  } catch (error) {
    window.$message?.error('数据刷新失败')
  } finally {
    loading.value = false
  }
}

const renderChart = () => {
  const chart = echarts.init(document.getElementById('chart')!)
  const dates = history.value.map(d => d.record_date)
  const sugar = history.value.map(d => d.sugar_close)
  const bdi = history.value.map(d => d.bdi_index)
  
  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { data: ['郑糖价格', 'BDI指数'], textStyle: { color: '#fff' } },
    xAxis: { type: 'category', data: dates, axisLabel: { color: '#fff' } },
    yAxis: [
      { type: 'value', name: '郑糖', axisLabel: { color: '#fff' }, nameTextStyle: { color: '#fff' } },
      { type: 'value', name: 'BDI', axisLabel: { color: '#fff' }, nameTextStyle: { color: '#fff' } }
    ],
    series: [
      { name: '郑糖价格', type: 'line', data: sugar, yAxisIndex: 0 },
      { name: 'BDI指数', type: 'bar', data: bdi, yAxisIndex: 1 }
    ]
  })
}

onMounted(fetchData)
</script>

<template>
  <NConfigProvider :theme="darkTheme">
    <NMessageProvider>
      <NLayout style="min-height: 100vh; background: #101014;">
        <NLayoutHeader style="height: 64px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; background: #18181c;">
          <div style="font-size: 24px; font-weight: bold;">🍬 Sugar Nexus 糖业情报局</div>
          <NButton @click="refreshData" :loading="loading">刷新数据</NButton>
        </NLayoutHeader>
        
        <div style="padding: 24px;">
          <NGrid :cols="4" :x-gap="16" style="margin-bottom: 24px;">
            <NGridItem>
              <NCard title="郑糖价格">
                <NStatistic :value="latest.sugar_close" suffix="元/吨" />
              </NCard>
            </NGridItem>
            <NGridItem>
              <NCard title="美元汇率">
                <NStatistic :value="latest.usd_cny_rate" />
              </NCard>
            </NGridItem>
            <NGridItem>
              <NCard title="BDI指数">
                <NStatistic :value="latest.bdi_index" />
              </NCard>
            </NGridItem>
            <NGridItem>
              <NCard title="估算进口成本">
                <NStatistic :value="latest.import_cost_estimate" suffix="元/吨" />
              </NCard>
            </NGridItem>
          </NGrid>
          
          <NCard title="历史趋势">
            <div id="chart" style="height: 500px;"></div>
          </NCard>
        </div>
      </NLayout>
    </NMessageProvider>
  </NConfigProvider>
</template>
