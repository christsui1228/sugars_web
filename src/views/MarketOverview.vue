<script setup lang="ts">
import { onMounted, inject, type Ref } from 'vue'
import MetricsGrid from '../components/MetricsGrid.vue'
import ChartCard from '../components/ChartCard.vue'
import { useMarketData } from '../composables/useMarketData'

const { history, metrics, fetchData } = useMarketData()

const startDate = inject<Ref<number>>('startDate')
const endDate = inject<Ref<number>>('endDate')

onMounted(() => {
  if (history.value.length === 0) {
    fetchData(startDate?.value, endDate?.value)
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
