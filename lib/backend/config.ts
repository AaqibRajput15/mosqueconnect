const required = (value: string | undefined) => typeof value === 'string' && value.trim().length > 0

export const backendConfig = {
  supabaseUrl: process.env.STORAGE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  serviceRoleKey: process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
}

export const isSupabaseEnabled = () => required(backendConfig.supabaseUrl) && required(backendConfig.serviceRoleKey)
