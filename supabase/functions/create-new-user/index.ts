import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  fonction: string;
  role: 'admin' | 'enterprise' | 'contributor' | 'validator';
  organization_level?: 'organization' | 'business_line' | 'subsidiary' | 'site';
  organization_name?: string;
  business_line_name?: string;
  subsidiary_name?: string;
  site_name?: string;
  processes: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { users }: { users: CreateUserRequest[] } = await req.json()

    const results = []

    for (const newUser of users) {
      try {
        // Validate required fields
        if (!newUser.email || !newUser.password || !newUser.nom || !newUser.prenom) {
          results.push({
            email: newUser.email,
            success: false,
            error: 'Champs obligatoires manquants'
          })
          continue
        }

        // Create user in auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: newUser.email,
          password: newUser.password,
          email_confirm: true,
          user_metadata: {
            nom: newUser.nom,
            prenom: newUser.prenom,
            fonction: newUser.fonction
          }
        })

        if (authError) {
          console.error('Auth error details:', authError);
          results.push({
            email: newUser.email,
            success: false,
            error: `Erreur auth: ${authError.message} (Code: ${authError.status || 'unknown'})`
          })
          continue
        }

        console.log('User created in auth:', authData.user?.id);

        // Create user record
        const { error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            email: newUser.email,
            nom: newUser.nom,
            prenom: newUser.prenom,
            fonction: newUser.fonction
          })

        if (userError) {
          console.error('User table error:', userError);
          results.push({
            email: newUser.email,
            success: false,
            error: `Erreur utilisateur: ${userError.message}`
          })
          // Cleanup: delete the auth user if user table creation failed
          await supabaseAdmin.auth.admin.deleteUser(authData.user!.id);
          continue
        }

        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            email: newUser.email,
            role: newUser.role,
            organization_level: newUser.organization_level || null,
            organization_name: newUser.organization_name || null,
            business_line_name: newUser.business_line_name || null,
            subsidiary_name: newUser.subsidiary_name || null,
            site_name: newUser.site_name || null
          })

        if (profileError) {
          console.error('Profile error:', profileError);
          results.push({
            email: newUser.email,
            success: false,
            error: `Erreur profil: ${profileError.message}`
          })
          // Cleanup: delete the auth user and user record if profile creation failed
          await supabaseAdmin.auth.admin.deleteUser(authData.user!.id);
          await supabaseAdmin.from('users').delete().eq('email', newUser.email);
          continue
        }

        // Create process assignments
        if (newUser.processes.length > 0) {
          const { error: processError } = await supabaseAdmin
            .from('user_processes')
            .insert({
              email: newUser.email,
              process_codes: newUser.processes
            })

          if (processError) {
            console.error('Process assignment error:', processError);
            results.push({
              email: newUser.email,
              success: false,
              error: `Erreur processus: ${processError.message}`
            })
            // Note: We don't cleanup here as the user is functional without process assignments
            continue
          }
        }

        results.push({
          email: newUser.email,
          success: true,
          error: null,
          userId: authData.user?.id
        })

      } catch (error) {
        console.error('Unexpected error for user:', newUser.email, error);
        results.push({
          email: newUser.email,
          success: false,
          error: `Erreur inattendue: ${error.message}`
        })
      }
    }

    return new Response(
      JSON.stringify({ results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})