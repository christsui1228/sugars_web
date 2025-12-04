<script setup lang="ts">
import { onMounted } from 'vue'
import MetricsGrid from '../components/MetricsGrid.vue'
import ChartCard from '../components/ChartCard.vue'
import { useMarketData } from '../composables/useMarketData'

const { history, metrics, fetchData } = useMarketData()

onMounted(() => {
  if (history.value.length === 0) {
    fetchData()
  }
})
</script>

<template>
  <div>
    <div style="margin-bottom: 32px;">
      <MetricsGrid :metrics="metrics" />
    </div>
    
    <ChartCard :data="history" />
  </div>
</template>
