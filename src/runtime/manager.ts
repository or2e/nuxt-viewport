import type { Ref } from 'vue-demi'
import { computed } from 'vue-demi'

import type { ViewportOptions, ViewportQuery } from './types'

const COOKIE_EXPIRES_IN_DAYS = 365 * 24 * 60 * 60 * 1000

export const DEFAULT_OPTIONS: ViewportOptions = {
  breakpoints: {
    desktop: 1024,
    desktopMedium: 1280,
    desktopWide: 1600,

    mobile: 320,
    mobileMedium: 375,
    mobileWide: 425,

    tablet: 768,
  },

  cookieName: 'viewport',

  defaultBreakpoints: {
    desktop: 'desktop',
    mobile: 'mobile',
    tablet: 'tablet',
  },

  fallbackBreakpoint: 'desktop',
}

export const STATE_KEY = 'viewportState'

export function createViewportManager(options: ViewportOptions, state: Ref<string>) {
  const breakpoint = computed<string>({
    get() {
      return state.value || options.fallbackBreakpoint
    },

    set(newBreakpoint) {
      state.value = newBreakpoint

      if (options.cookieName && typeof window !== 'undefined') {
        const date = new Date()
        date.setTime(date.getTime() + COOKIE_EXPIRES_IN_DAYS)

        document.cookie = `${options.cookieName}=${state.value}; SameSite=Strict; Secure; Expires=${date.toUTCString()}; Path=/`
      }
    },
  })

  const queries = computed<Record<string, ViewportQuery>>(() => {
    const breakpoints = options.breakpoints || {}
    const breakpointsKeys = Object.keys(breakpoints).sort((a, b) => breakpoints[a] - breakpoints[b])

    const output: Record<string, ViewportQuery> = {}
    let i = breakpointsKeys.length

    while (i--) {
      const currentKey = breakpointsKeys[i]

      const size = breakpoints[currentKey]
      const nextSize = breakpoints[breakpointsKeys[i + 1]]

      let mediaQuery = ''

      if (i > 0) {
        mediaQuery = `(min-width: ${size}px)`
      } else {
        mediaQuery = '(min-width: 1px)'
      }

      if (nextSize) {
        mediaQuery += ` and (max-width: ${nextSize - 1}px)`
      }

      output[currentKey] = {
        mediaQuery,
        size,
      }
    }

    return output
  })

  const queriesKeys = computed(() => Object.keys(queries.value))

  return {
    breakpoint,
    breakpointValue,

    isGreaterThan,
    isGreaterOrEquals,

    isLessThan,

    match,
    matches,

    queries,
  }

  /**
   * Returns breakpoint size from breakpoint name.
   * @param searchBreakpoint - Breakpoint to search.
   */
  function breakpointValue(searchBreakpoint: string) {
    const breakpoints = options.breakpoints || {}

    return breakpoints[searchBreakpoint]
  }

  /**
   * Returns true, if searchBreakpoint is strictly greater than the current breakpoint.
   * @param searchBreakpoint - Breakpoint to search.
   */
  function isGreaterThan(searchBreakpoint: string) {
    const currentIndex = queriesKeys.value.indexOf(breakpoint.value)
    const breakpointIndex = queriesKeys.value.indexOf(searchBreakpoint)

    if (breakpointIndex === -1) {
      return false
    }

    return breakpointIndex > currentIndex
  }

  /**
   * Returns true, if searchBreakpoint is greater or equals the current breakpoint.
   * @param searchBreakpoint - Breakpoint to search.
   */
  function isGreaterOrEquals(searchBreakpoint: string) {
    return isGreaterThan(searchBreakpoint) || match(searchBreakpoint)
  }

  /**
   * Returns true, if searchBreakpoint is less, than the current breakpoint.
   * @param searchBreakpoint - Breakpoint to search.
   */
  function isLessThan(searchBreakpoint: string) {
    const currentIndex = queriesKeys.value.indexOf(breakpoint.value)
    const breakpointIndex = queriesKeys.value.indexOf(searchBreakpoint)

    if (breakpointIndex === -1) {
      return false
    }

    return breakpointIndex < currentIndex
  }

  /**
   * Returns true if current breakpoint is matching the value.
   * @param breakpointToMatch - Breakpoint value to match.
   */
  function match(breakpointToMatch: string) {
    return breakpoint.value === breakpointToMatch
  }

  /**
   * Returns true if current breakpoint is included in the values.
   * @param breakpointsToMatch - Breakpoints to match.
   */
  function matches(...breakpointsToMatch: string[]) {
    return breakpointsToMatch.includes(breakpoint.value)
  }
}
