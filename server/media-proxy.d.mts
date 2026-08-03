import type { IncomingMessage, ServerResponse } from 'node:http'

export function handleMediaProxy(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void>
