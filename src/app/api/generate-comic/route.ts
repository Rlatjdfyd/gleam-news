// app/api/generate-comic/route.ts
import { NextResponse } from 'next/server';

// Google AI API를 호출하는 함수
async function getAiResponse(article: string, apiKey: string, imageStyle: string) {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // AI에게 역할을 부여하고, 수행할 작업을 명확하게 지시하는 프롬프트
  const metaPrompt = `
    You are an AI assistant for an app called "Gleam News". Your task is to create a scenario and prompts for a 4-cut comic based on the provided news article.
    Ensure all generated content (summary, captions, and prompts) strictly adheres to safety policies, avoiding any harmful, hateful, or inappropriate content.
    Avoid using specific personal names or exact geographical locations in the summary, captions, and prompts. Instead, use general terms like 'a person,' 'the city,' 'the region,' or 'the individual' where appropriate.

    Perform the following tasks:
    0.  **Extract Article Title**: Identify the main title of the provided news article. This MUST be a concise, single-line title, and it MUST be in Korean. Do NOT use English for the article title.
    1.  **Summarize**: Create a 4-point summary of the article. Each point will be a title for a comic panel and must be concise, under 15 Korean characters.
    2.  **Generate Prompts**: For each of the 4 summary points, create a detailed and visually rich prompt for an image generation AI, in the ${imageStyle} style. Based on the news article's primary geographical or cultural context, describe human characters as either 'East Asian' or 'Western' (Caucasian). The prompts should be in English. Each prompt must end with "--ar 1:1".

    3.  **Generate Captions**: For each of the 4 summary points, create a detailed caption in Korean, describing the scene or event for the comic panel. Each caption should be around 50 Korean characters, providing more descriptive detail.

    The final output MUST be a single, valid JSON object. Do NOT include any other text or conversational elements outside of this JSON object.
    The JSON object MUST have five keys: "articleTitle" (a string), "mainImagePrompt" (a string), "summary" (an array of 4 Korean strings), "captions" (an array of 4 Korean strings), and "prompts" (an array of 4 English strings).
    Example format:
    {
      "articleTitle": "기사 제목 예시",
      "mainImagePrompt": "A background image representing the theme --ar 1:1",
      "summary": ["Summary 1", "Summary 2", "Summary 3", "Summary 4"],
      "captions": ["Caption 1", "Caption 2", "Caption 3", "Caption 4"],
      "prompts": ["Prompt 1 --ar 1:1", "Prompt 2 --ar 1:1", "Prompt 3 --ar 1:1", "Prompt 4 --ar 1:1"]
    }

    Here is the article:
    ---
    ${article}
    ---
  `;

  const requestBody = {
    contents: [
      {
        parts: [{ text: metaPrompt }],
      },
    ],
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.json();
    const errorMessage = errorBody.error?.message || `Google AI API request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // AI의 응답에서 실제 텍스트(JSON 형식의 문자열)를 추출
  const jsonString = data.candidates[0].content.parts[0].text;
  
  // 정규 표현식을 사용하여 순수한 JSON 객체 부분만 추출
  const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
  if (!jsonMatch || !jsonMatch[0]) {
    throw new Error('AI 응답에서 유효한 JSON을 찾을 수 없습니다.');
  }
  const cleanedJsonString = jsonMatch[0];

  // JSON 형식의 문자열을 실제 JSON 객체로 파싱
  return JSON.parse(cleanedJsonString);
}

export async function POST(request: Request) {
  try {
    const { article, selectedStyle } = await request.json();
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error('Google API key is not configured.');
    }

    if (!article) {
      return NextResponse.json({ error: 'Article content is required.' }, { status: 400 });
    }

    // AI 함수를 호출하여 동적인 결과물을 받음
    const aiData = await getAiResponse(article, apiKey, selectedStyle);

    return NextResponse.json(aiData);

  } catch (error) {
    console.error('Error in generate-comic API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
