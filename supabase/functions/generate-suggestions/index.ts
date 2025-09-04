import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import OpenAI from 'npm:openai@4.28.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SuggestionRequest {
  sector: string;
  subsector?: string;
  standards: string[];
  type: 'issues' | 'standards';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sector, subsector, standards, type } = await req.json() as SuggestionRequest;

    if (!sector || !type) {
      throw new Error('Les champs sector et type sont requis');
    }

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    const sectorInfo = subsector ? `${sector} (${subsector})` : sector;
    const standardsInfo = standards?.length > 0 ? `en considérant les normes: ${standards.join(', ')}` : '';

    const messages = [
      {
        role: "system",
        content: type === 'issues'
          ? `Tu es un expert en ESG qui suggère des enjeux pertinents pour le secteur ${sectorInfo} ${standardsInfo}. Format: nom|description`
          : `Tu es un expert en ESG qui suggère des normes pertinentes pour le secteur ${sectorInfo}. Format: nom|description`
      },
      {
        role: "user",
        content: `Suggère 5 ${type === 'issues' ? 'enjeux ESG' : 'normes'} pour le secteur ${sectorInfo}`
      }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4-mini",
      messages,
      temperature: 0.7,
      store: true
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('Pas de suggestions générées');
    }

    const suggestions = completion.choices[0].message.content
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [name, description] = line.split('|').map(s => s.trim());
        return {
          name,
          description,
          sector,
          subsector,
          type: type === 'issues' ? 'issue' : 'standard'
        };
      });

    return new Response(
      JSON.stringify({ suggestions }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Erreur dans la fonction Edge:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erreur interne du serveur',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});