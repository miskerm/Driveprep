'use client'

import { useEffect } from 'react'

export function MeasureGuard() {
  useEffect(() => {
    const perf = performance as unknown as { __drivoprepMeasureGuard?: boolean; measure: any }
    if (typeof perf.measure !== 'function') return
    if (perf.__drivoprepMeasureGuard) return
    perf.__drivoprepMeasureGuard = true
    const original = perf.measure.bind(perf)
    perf.measure = function (name: string, options: any) {
      if (options && typeof options === 'object' && !Array.isArray(options)) {
        const patched = Object.assign({}, options)
        const start = patched.start
        const end = patched.end
        if (typeof start === 'number' && (!isFinite(start) || start < 0)) patched.start = 0
        if (typeof end === 'number' && (!isFinite(end) || end < 0)) {
          patched.end = typeof start === 'number' ? start : 0
        }
        if (typeof start === 'number' && typeof end === 'number' && end < start) {
          patched.end = start
        }
        return original(name, patched)
      }
      return original.apply(null, arguments as any)
    }
  }, [])
  return null
}
