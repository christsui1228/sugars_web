/**
 * 市场数据计算工具函数
 */

// 1. 计算进口成本
export interface ImportCostParams {
  icePrice: number      // ICE 原糖价格（美分/磅）
  usdCnyRate: number    // 美元汇率
  bdiIndex: number      // BDI 指数
  tariffRate: number    // 关税率（0.15 或 0.50）
}

export function calculateImportCost(params: ImportCostParams): number {
  const { icePrice, usdCnyRate, bdiIndex, tariffRate } = params
  
  // 转换系数：1美分/磅 → 元/吨
  const conversionFactor = 22.0462
  
  // 原糖到岸价（不含关税）
  const basePrice = icePrice * usdCnyRate * conversionFactor
  
  // 关税
  const tariff = basePrice * tariffRate
  
  // 运费估算（简化公式）
  const freight = bdiIndex / 10 + 200
  
  // 总进口成本
  return basePrice + tariff + freight
}

// 2. 计算皮尔逊相关系数
export function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n !== y.length || n === 0) return 0
  
  // 计算均值
  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n
  
  // 计算协方差和标准差
  let covariance = 0
  let varianceX = 0
  let varianceY = 0
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX
    const dy = y[i] - meanY
    covariance += dx * dy
    varianceX += dx * dx
    varianceY += dy * dy
  }
  
  // 皮尔逊相关系数
  if (varianceX === 0 || varianceY === 0) return 0
  const correlation = covariance / Math.sqrt(varianceX * varianceY)
  return correlation
}

// 3. 相关性强度判断
export function getCorrelationStrength(r: number): {
  strength: string
  color: string
  description: string
} {
  const abs = Math.abs(r)
  
  if (abs >= 0.7) {
    return {
      strength: r > 0 ? '强正相关' : '强负相关',
      color: '#007AFF',
      description: abs >= 0.9 ? '极强相关' : '强相关'
    }
  } else if (abs >= 0.4) {
    return {
      strength: r > 0 ? '中等正相关' : '中等负相关',
      color: '#FF9500',
      description: '中等相关'
    }
  } else {
    return {
      strength: '弱相关',
      color: '#86868B',
      description: '弱相关或无相关'
    }
  }
}

// 4. 数据归一化
export function normalizeData(data: number[]): number[] {
  if (data.length === 0) return []
  const base = data[0]!
  if (base === 0) return data.map(() => 100)
  return data.map(value => (value / base) * 100)
}

// 5. 线性回归
export function linearRegression(x: number[], y: number[]): {
  slope: number
  intercept: number
  r2: number
  predict: (xValue: number) => number
} {
  const n = x.length
  if (n !== y.length || n === 0) {
    return { slope: 0, intercept: 0, r2: 0, predict: () => 0 }
  }
  
  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n
  
  let numerator = 0
  let denominator = 0
  
  for (let i = 0; i < n; i++) {
    numerator += (x[i]! - meanX) * (y[i]! - meanY)
    denominator += (x[i]! - meanX) ** 2
  }
  
  const slope = denominator === 0 ? 0 : numerator / denominator
  const intercept = meanY - slope * meanX
  
  // 计算 R²
  const correlation = calculateCorrelation(x, y)
  const r2 = correlation ** 2
  
  // 预测函数
  const predict = (xValue: number) => slope * xValue + intercept
  
  return { slope, intercept, r2, predict }
}

// 6. 计算套利利润
export function calculateArbitrageProfit(
  domesticPrice: number,  // 郑糖价格
  importCost: number      // 进口成本
): number {
  return domesticPrice - importCost
}

// 7. 判断套利窗口状态
export function getArbitrageStatus(profit: number): {
  status: 'open' | 'closed'
  color: string
  icon: string
  text: string
} {
  if (profit > 0) {
    return {
      status: 'open',
      color: '#34C759',
      icon: '🟢',
      text: '窗口开启'
    }
  } else {
    return {
      status: 'closed',
      color: '#FF3B30',
      icon: '🔴',
      text: '窗口关闭'
    }
  }
}

// 8. 计算利润分布统计
export function calculateProfitDistribution(profits: number[]): {
  profitableDays: number
  lossDays: number
  profitableRatio: number
} {
  const profitableDays = profits.filter(p => p > 0).length
  const lossDays = profits.filter(p => p <= 0).length
  const profitableRatio = profits.length > 0 ? (profitableDays / profits.length) * 100 : 0
  
  return {
    profitableDays,
    lossDays,
    profitableRatio
  }
}
