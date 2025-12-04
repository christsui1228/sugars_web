<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NConfigProvider, NMessageProvider, NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NMenu, NButton } from 'naive-ui'
import { useResponsive } from './composables/useResponsive'
import { useMarketData } from './composables/useMarketData'

const router = useRouter()
const route = useRoute()
const { isMobile } = useResponsive()
const { loading, fetchData } = useMarketData()

const collapsed = ref(false)

const siderWidth = computed(() => {
  if (isMobile.value) return 0
  return collapsed.value ? 64 : 240
})

const menuOptions = [
  {
    label: '📊 市场概览',
    key: 'Market'
  },
  {
    label: '💰 套利分析',
    key: 'Arbitrage'
  },
  {
    label: '📈 宏观驱动',
    key: 'Macro'
  }
]

const activeKey = computed(() => route.name as string)

const handleMenuSelect = (key: string) => {
  router.push({ name: key })
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
          :collapsed="collapsed"
          collapse-mode="width"
          bordered
          style="background: #FFFFFF;"
        >
          <div style="padding: 24px 16px;">
            <div v-if="!collapsed" style="font-size: 20px; font-weight: 700; color: #1D1D1F; margin-bottom: 24px;">
              Sugar Nexus
            </div>
            <div v-else style="font-size: 24px; text-align: center; margin-bottom: 24px;">
              S
            </div>
          </div>
          <NMenu
            :value="activeKey"
            :options="menuOptions"
            :collapsed="collapsed"
            :collapsed-width="64"
            :collapsed-icon-size="22"
            @update:value="handleMenuSelect"
          />
        </NLayoutSider>

        <NLayout>
          <!-- 顶栏 -->
          <NLayoutHeader style="height: 80px; padding: 0 32px; display: flex; align-items: center; justify-content: space-between; background: #FFFFFF; border-bottom: 1px solid #E5E5EA;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <NButton
                v-if="!isMobile"
                text
                @click="collapsed = !collapsed"
                style="font-size: 20px;"
              >
                {{ collapsed ? '☰' : '✕' }}
              </NButton>
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 40px; height: 40px; background: #1D1D1F; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 20px;">
                  S
                </div>
                <div>
                  <div style="font-size: 24px; font-weight: 700; color: #1D1D1F;">Sugar Nexus</div>
                  <div style="font-size: 14px; font-weight: 400; color: #86868B;">糖业情报局</div>
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="font-size: 14px; color: #86868B; font-weight: 400;">
                📅 2020-01 - 2024-12
              </div>
              <NButton @click="refreshData" :loading="loading" secondary>刷新数据</NButton>
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
