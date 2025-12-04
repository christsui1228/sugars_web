import { computed } from 'vue'
import { useWindowSize } from '@vueuse/core'

export function useResponsive() {
  const { width } = useWindowSize()

  const isMobile = computed(() => width.value < 768)
  const isTablet = computed(() => width.value >= 768 && width.value < 1280)
  const isDesktop = computed(() => width.value >= 1280)

  const gridCols = computed(() => {
    if (isDesktop.value) return 4
    if (isTablet.value) return 2
    return 1
  })

  return {
    isMobile,
    isTablet,
    isDesktop,
    gridCols
  }
}
