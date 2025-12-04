import { ref, computed } from 'vue'
import axios from 'axios'

interface DailyData {
  record_date: string
  sugar_close: number
  usd_cny_rate: number
  bdi_index: number
  import_cost_estimate: number
}

// 全局共享的数据状态
const latest = ref<DailyData | null>(null)
const history = ref<DailyData[]>([])
const loading = ref(false)

export function useMarketData() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
  
  const fetchData = async () => {
    loading.value = true
    try {
      const [latestRes, historyRes] = await Promise.all([
        axios.get(`${API_BASE}/api/market/daily?limit=1`),
        axios.get(`${API_BASE}/api/market/daily?limit=30`)
      ])
      
      latest.value = latestRes.data[0] || null
      history.value = historyRes.data || []
    } catch (error) {
      console.error('数据加载失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  // 计算指标数据
  const metrics = computed(() => {
    if (!latest.value) return []
    
    const prev = history.value[1]
    
    return [
      {
        title: '郑糖价格',
        value: latest.value.sugar_close,
        suffix: '元/吨',
        change: prev ? ((latest.value.sugar_close - prev.sugar_close) / prev.sugar_close * 100) : undefined
      },
      {
        title: '美元汇率',
        value: latest.value.usd_cny_rate,
        decimals: 4,
        change: prev ? ((latest.value.usd_cny_rate - prev.usd_cny_rate) / prev.usd_cny_rate * 100) : undefined
      },
      {
        title: 'BDI指数',
        value: latest.value.bdi_index,
        change: prev ? ((latest.value.bdi_index - prev.bdi_index) / prev.bdi_index * 100) : undefined
      },
      {
        title: '估算进口成本',
        value: latest.value.import_cost_estimate,
        suffix: '元/吨',
        change: prev ? ((latest.value.import_cost_estimate - prev.import_cost_estimate) / prev.import_cost_estimate * 100) : undefined
      }
    ]
  })
  
  return {
    latest,
    history,
    loading,
    fetchData,
    metrics
  }
}
