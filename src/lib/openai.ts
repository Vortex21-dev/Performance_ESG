import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

export const openai = new OpenAIApi(configuration);

export async function generateSuggestions(sector: string, type: 'issues' | 'standards') {
  try {
    const prompt = type === 'issues' 
      ? `Pour le secteur "${sector}", suggérer 5 enjeux ESG pertinents. Format: nom|description`
      : `Pour le secteur "${sector}", suggérer 3 normes ou certifications appropriées. Format: nom|description`;

    const completion = await openai.createCompletion({
      model: "gpt-3.5-turbo",
      prompt,
      max_tokens: 500,
      temperature: 0.7,
    });

    const suggestions = completion.data.choices[0].text?.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [name, description] = line.split('|');
        return { name: name.trim(), description: description?.trim() };
      });

    return suggestions || [];
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return [];
  }
}