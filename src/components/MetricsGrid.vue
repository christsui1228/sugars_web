<script setup lang="ts">
import { NGrid, NGridItem } from 'naive-ui'
import MetricCard from './MetricCard.vue'
import { useResponsive } from '../composables/useResponsive'

interface MetricData {
  title: string
  value: number
  suffix?: string
  change?: number
}

interface Props {
  metrics: MetricData[]
}

defineProps<Props>()

const { gridCols } = useResponsive()
</script>

<template>
  <NGrid :cols="gridCols" :x-gap="20" :y-gap="20">
    <NGridItem v-for="metric in metrics" :key="metric.title">
      <MetricCard v-bind="metric" />
    </NGridItem>
  </NGrid>
</template>
