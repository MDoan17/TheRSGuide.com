import type { IncomingMessage, ServerResponse } from 'node:http'

export function handleSharesApi(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void>
