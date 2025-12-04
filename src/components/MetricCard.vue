<script setup lang="ts">
import { NCard } from 'naive-ui'
import { computed } from 'vue'

interface Props {
  title: string
  value: number
  suffix?: string
  change?: number
  decimals?: number
}

const props = withDefaults(defineProps<Props>(), {
  decimals: 0
})

const formattedValue = computed(() => {
  if (props.decimals > 0) {
    return props.value.toFixed(props.decimals)
  }
  return props.value.toString()
})

const changeColor = computed(() => {
  if (!props.change) return '#86868B'
  return props.change > 0 ? '#34C759' : '#FF3B30'
})

const changeText = computed(() => {
  if (!props.change) return ''
  const sign = props.change > 0 ? '+' : ''
  return `${sign}${props.change.toFixed(1)}%`
})
</script>

<template>
  <NCard 
    :bordered="true" 
    style="height: 160px; border: 1px solid #E5E5EA; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); border-radius: 12px;"
  >
    <div style="height: 100%; display: flex; flex-direction: column;">
      <!-- 顶部：标题和涨跌幅 -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
        <span style="font-size: 14px; color: #86868B; font-weight: 500;">{{ title }}</span>
        <span 
          v-if="change !== undefined" 
          :style="{ 
            fontSize: '14px', 
            color: changeColor, 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }"
        >
          {{ changeText }}
        </span>
      </div>
      
      <!-- 中间：数值和单位 -->
      <div style="flex: 1; display: flex; align-items: flex-end;">
        <span style="font-size: 48px; font-weight: 700; color: #1D1D1F; line-height: 1;">{{ formattedValue }}</span>
        <span 
          v-if="suffix" 
          style="font-size: 14px; color: #86868B; margin-left: 8px; margin-bottom: 6px;"
        >
          {{ suffix }}
        </span>
      </div>
    </div>
  </NCard>
</template>
