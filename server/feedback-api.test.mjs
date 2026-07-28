import { describe, expect, it } from 'vitest'
import { validateFeedbackPayload } from './feedback-api.mjs'

describe('feedback payload validation', () => {
  it('normalizes valid messages and page paths', () => {
    expect(validateFeedbackPayload({
      message: '  A useful suggestion  ',
      page: '/guides/skill-training?username=Player',
    })).toEqual({
      message: 'A useful suggestion',
      page: '/guides/skill-training?username=Player',
    })
  })

  it('requires a message', () => {
    expect(validateFeedbackPayload({ message: '   ' })).toEqual({
      error: 'Message is required',
    })
  })

  it('rejects messages longer than the Discord-safe limit', () => {
    expect(validateFeedbackPayload({ message: 'a'.repeat(1501) })).toEqual({
      error: 'Message must be 1500 characters or fewer',
    })
  })

  it('does not accept an external page URL', () => {
    expect(validateFeedbackPayload({
      message: 'Hello',
      page: 'https://example.com',
    })).toMatchObject({ page: '/' })
  })
})
