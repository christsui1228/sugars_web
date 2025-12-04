<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NConfigProvider, NMessageProvider, NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NMenu, NButton, NDatePicker } from 'naive-ui'
import { useResponsive } from './composables/useResponsive'
import { useMarketData } from './composables/useMarketData'

const router = useRouter()
const route = useRoute()
const { isMobile } = useResponsive()
const { loading, fetchData } = useMarketData()

const siderWidth = computed(() => {
  if (isMobile.value) return 0
  return 288  // 固定宽度，不再折叠
})

// 日期范围
const startDate = ref(new Date('2024-11-26').getTime())
const endDate = ref(new Date('2025-11-26').getTime())

const menuOptions = [
  {
    label: '📊 市场概览',
    key: 'Market',
    style: 'font-size: 25px;'
  },
  {
    label: '💰 套利分析',
    key: 'Arbitrage',
    style: 'font-size: 25px;'
  },
  {
    label: '📈 宏观驱动',
    key: 'Macro',
    style: 'font-size: 25px;'
  }
]

const activeKey = computed(() => route.name as string)

const handleMenuSelect = (key: string) => {
  router.push({ name: key })
}

const setDateRange = (days: number) => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  startDate.value = start.getTime()
  endDate.value = end.getTime()
}

const refreshData = async () => {
  try {
    await fetchData()
    window.$message?.success('数据刷新成功')
  } catch (error) {
    window.$message?.error('数据刷新失败')
  }
}
</script>

<template>
  <NConfigProvider>
    <NMessageProvider>
      <NLayout has-sider style="min-height: 100vh; background: #F5F5F7;">
        <!-- 侧边栏 -->
        <NLayoutSider
          v-if="!isMobile"
          :width="siderWidth"
          bordered
          style="background: #FFFFFF;"
        >
          <div style="padding: 24px 16px;">
            <div style="font-size: 30px; font-weight: 700; color: #1D1D1F; margin-bottom: 24px; text-align: center;">
              Sugar Nexus
            </div>
          </div>
          <NMenu
            :value="activeKey"
            :options="menuOptions"
            @update:value="handleMenuSelect"
            style="font-size: 25px;"
          />
        </NLayoutSider>

        <NLayout>
          <!-- 顶栏 -->
          <NLayoutHeader style="height: 80px; padding: 0 32px; display: flex; align-items: center; justify-content: flex-end; background: #FFFFFF; border-bottom: 1px solid #E5E5EA;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 14px; color: #86868B;">开始日期</span>
                <NDatePicker 
                  v-model:value="startDate" 
                  type="date"
                  style="width: 160px;"
                />
                <span style="font-size: 14px; color: #86868B;">结束日期</span>
                <NDatePicker 
                  v-model:value="endDate" 
                  type="date"
                  style="width: 160px;"
                />
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 14px; color: #86868B;">快捷选择:</span>
                <NButton @click="setDateRange(7)" size="small" secondary>最近7天</NButton>
                <NButton @click="setDateRange(30)" size="small" secondary>最近30天</NButton>
                <NButton @click="setDateRange(90)" size="small" secondary>最近90天</NButton>
              </div>
              <NButton @click="refreshData" :loading="loading" type="success">🔄 加载数据</NButton>
            </div>
          </NLayoutHeader>

          <!-- 内容区域 -->
          <NLayoutContent style="padding: 32px;">
            <RouterView />
          </NLayoutContent>
        </NLayout>
      </NLayout>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style>
/* 侧边栏菜单项样式优化 */
.n-menu-item {
  font-size: 25px !important;
  padding: 16px 20px !important;
  height: auto !important;
  min-height: 60px !important;
}

.n-menu-item-content {
  font-size: 25px !important;
}

.n-menu-item-content__icon {
  font-size: 36px !important;  /* 图标也相应增大 */
  margin-right: 16px !important;
}

/* 折叠状态下的图标 */
.n-menu--collapsed .n-menu-item-content__icon {
  font-size: 38px !important;
}
</style>
