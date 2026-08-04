import type { IncomingMessage, ServerResponse } from 'node:http'

export function isHealthRequest(req: IncomingMessage): boolean
export function handleHealth(
  req: IncomingMessage,
  res: ServerResponse,
): void
