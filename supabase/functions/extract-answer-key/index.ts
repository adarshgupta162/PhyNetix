import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { imageBase64, totalQuestions, examType } = await req.json();

    if (!imageBase64) {
      throw new Error('Image data is required');
    }

    console.log('Extracting answer key for', totalQuestions, 'questions, exam type:', examType);

    const systemPrompt = `You are an expert at extracting answer keys from exam answer sheets. 
You will be given an image of an answer key and need to extract the correct answers for each question.

Rules:
1. Extract answers for question numbers 1 to ${totalQuestions || 'as many as you can find'}
2. For single choice questions (MCQ), the answer should be a single letter: A, B, C, or D
3. For multiple choice questions, the answer should be an array of letters like ["A", "C"] or ["B", "D"]
4. For numerical/integer questions, the answer should be a number as a string like "42" or "-5.5"
5. If a question is marked as bonus or dropped, indicate it

Return your response as a JSON object with this exact structure:
{
  "answers": [
    { "questionNumber": 1, "answer": "A", "type": "single" },
    { "questionNumber": 2, "answer": ["A", "C"], "type": "multiple" },
    { "questionNumber": 3, "answer": "42", "type": "integer" }
  ],
  "confidence": 0.95,
  "notes": "Any observations about the answer key"
}

Only return valid JSON, no other text.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              { 
                type: 'text', 
                text: `Please extract the answer key from this image. The exam type is ${examType || 'JEE Mains'}. Extract answers for all questions you can identify.` 
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('Raw AI response:', content);

    // Parse the JSON response
    let parsedResponse;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse AI response',
          rawResponse: content 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracted answers:', parsedResponse.answers?.length);

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-answer-key:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
