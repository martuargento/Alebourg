import { createClient } from '@supabase/supabase-js';

// Usar Service Role KEY solo en el backend (funciones serverless)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceRoleKey) {
	console.warn('SUPABASE_URL o SUPABASE_SERVICE_ROLE no están configuradas. Se usará el JSON local como fallback.');
}

export const getSupabaseServerClient = () => {
	if (!supabaseUrl || !supabaseServiceRoleKey) return null;
	return createClient(supabaseUrl, supabaseServiceRoleKey, {
		auth: { persistSession: false }
	});
};
