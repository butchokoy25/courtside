type LogLevel = 'error' | 'warn' | 'info'

function log(level: LogLevel, context: string, message: string, data?: unknown) {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`

  if (level === 'error') {
    console.error(prefix, message, data ?? '')
  } else if (level === 'warn') {
    console.warn(prefix, message, data ?? '')
  } else {
    console.info(prefix, message, data ?? '')
  }
}

export const logger = {
  error: (context: string, message: string, data?: unknown) => log('error', context, message, data),
  warn: (context: string, message: string, data?: unknown) => log('warn', context, message, data),
  info: (context: string, message: string, data?: unknown) => log('info', context, message, data),
}
