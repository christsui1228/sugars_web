import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/market'
  },
  {
    path: '/market',
    name: 'Market',
    component: () => import('../views/MarketOverview.vue'),
    meta: { title: '市场概览', icon: '📊' }
  },
  {
    path: '/arbitrage',
    name: 'Arbitrage',
    component: () => import('../views/ArbitrageAnalysis.vue'),
    meta: { title: '套利分析', icon: '💰' }
  },
  {
    path: '/macro',
    name: 'Macro',
    component: () => import('../views/MacroDrivers.vue'),
    meta: { title: '宏观驱动', icon: '📈' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
