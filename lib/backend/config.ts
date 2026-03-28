const required = (value: string | undefined) => typeof value === 'string' && value.trim().length > 0

const resolveServiceRoleKey = () => {
  if (typeof window !== 'undefined') return undefined
  return process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
}

export const backendConfig = {
  supabaseUrl: process.env.STORAGE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  serviceRoleKey: resolveServiceRoleKey(),
}

export const isSupabaseEnabled = () => required(backendConfig.supabaseUrl) && required(backendConfig.serviceRoleKey)
