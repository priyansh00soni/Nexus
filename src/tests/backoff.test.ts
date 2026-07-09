import {  test, expect } from 'vitest'
import { backoff } from '../utils/backoff.js'
test('exponential backoff works',()=>{
    expect(backoff(0)).toBe(1000)
    expect(backoff(1)).toBe(2000)
    expect(backoff(2)).toBe(4000)
    expect(backoff(3)).toBe(8000)
    expect(backoff(4)).toBe(16000)
    expect(backoff(5)).toBe(30000)
    expect(backoff(6)).toBe(30000)
    expect(backoff(7)).toBe(30000)
})