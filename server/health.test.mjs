import { describe, expect, it, vi } from 'vitest'
import { handleHealth, isHealthRequest } from './health.mjs'

const response = () => ({
  end: vi.fn(),
  writeHead: vi.fn(),
})

describe('health endpoint', () => {
  it('matches the health path with or without a query string', () => {
    expect(isHealthRequest({ url: '/health' })).toBe(true)
    expect(isHealthRequest({ url: '/health?source=load-balancer' })).toBe(true)
    expect(isHealthRequest({ url: '/healthcheck' })).toBe(false)
  })

  it('returns an uncached healthy response', () => {
    const res = response()

    handleHealth({ method: 'GET' }, res)

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
    }))
    expect(res.end).toHaveBeenCalledWith('{"status":"ok"}')
  })

  it('supports HEAD requests without a response body', () => {
    const res = response()

    handleHealth({ method: 'HEAD' }, res)

    expect(res.writeHead).toHaveBeenCalledWith(200, expect.any(Object))
    expect(res.end).toHaveBeenCalledWith(undefined)
  })

  it('rejects unsupported methods', () => {
    const res = response()

    handleHealth({ method: 'POST' }, res)

    expect(res.writeHead).toHaveBeenCalledWith(405, expect.objectContaining({
      allow: 'GET, HEAD',
    }))
  })
})
