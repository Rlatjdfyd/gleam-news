// app/api/generate-comic/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function generateTextData(apiKey: string, article: string, imageStyle: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const metaPrompt = `
    You are an AI assistant for an app called "Gleam News". Your task is to create a scenario and prompts for a 4-cut comic based on the provided news article.
    Ensure all generated content (summary, captions, and prompts) strictly adheres to safety policies, avoiding any harmful, hateful, or inappropriate content.
    Avoid using specific personal names or exact geographical locations in the summary, captions, and prompts. Instead, use general terms like 'a person,' 'the city,' 'the region,' or 'the individual' where appropriate.

    Perform the following tasks:
    0.  **Extract Article Title**: Identify the main title of the provided news article. This MUST be a concise, single-line title, and it MUST be in Korean. Do NOT use English for the article title.
    1.  **Summarize**: Create a 4-point summary of the article. Each point will be a title for a comic panel and must be concise, under 15 Korean characters.
    2.  **Generate Prompts**: For each of the 4 summary points, create a detailed and visually rich prompt for an image generation AI. Based on the news article's primary geographical or cultural context, describe human characters as either 'East Asian' or 'Western' (Caucasian). The prompts should be in English. Each prompt must end with "--ar 1:1".

    3.  **Generate Captions**: For each of the 4 summary points, create a detailed caption in Korean, describing the scene or event for the comic panel. Each caption should be around 50 Korean characters, providing more descriptive detail.
    4.  **Generate Tags**: Create a list of 5 to 7 concise Korean keywords that represent the entire article's main topics.

    The final output MUST be a single, valid JSON object. Do NOT include any other text or conversational elements outside of this JSON object.
    The JSON object MUST have six keys: "articleTitle" (a string), "mainImagePrompt" (a string, should be in ${imageStyle} style), "summary" (an array of 4 Korean strings), "captions" (an array of 4 Korean strings), "prompts" (an array of 4 English strings), and "tags" (an array of Korean strings).
    Example format:
    {
      "articleTitle": "기사 제목 예시",
      "mainImagePrompt": "A background image representing the theme in ${imageStyle} style --ar 1:1",
      "summary": ["Summary 1", "Summary 2", "Summary 3", "Summary 4"],
      "captions": ["Caption 1", "Caption 2", "Caption 3", "Caption 4"],
      "prompts": ["Prompt 1 --ar 1:1", "Prompt 2 --ar 1:1", "Prompt 3 --ar 1:1", "Prompt 4 --ar 1:1"],
      "tags": ["#핵심태그1", "#핵심태그2", "#핵심태그3", "#핵심태그4", "#핵심태그5"]
    }

    Here is the article:
    ---
    ${article}
    ---
  `;

  const result = await model.generateContent(metaPrompt);
  const response = result.response;
  const jsonString = response.text();
  
  const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
  if (!jsonMatch || !jsonMatch[0]) {
    throw new Error('AI 응답에서 유효한 JSON을 찾을 수 없습니다.');
  }
  const cleanedJsonString = jsonMatch[0];
  return JSON.parse(cleanedJsonString);
}

async function generateImages(apiKey: string, prompts: string[]) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });

  const images = [];
  for (const prompt of prompts) {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const part = response.candidates?.[0]?.content.parts[0];
    if (part && 'inlineData' in part) {
      images.push(part.inlineData.data);
    } else {
      console.warn(`Image generation failed for prompt: "${prompt}"`);
      images.push(null);
    }
    // Add a 10-second delay to respect the Free Tier rate limit
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  return images;
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

    // 1. 텍스트 데이터 (프롬프트 포함) 생성
    const textData = await generateTextData(apiKey, article, selectedStyle);

    // 2. 생성된 프롬프트를 사용하여 이미지 생성
    const panelPrompts = textData.prompts.map((p: string) => p.replace(/--ar 1:1/g, '').trim());
    const combinedPrompt = `A ${selectedStyle} illustration of the news article, shown in four panels in a 2x2 grid layout within one image:
    - Panel 1: ${panelPrompts[0]}
    - Panel 2: ${panelPrompts[1]}
    - Panel 3: ${panelPrompts[2]}
    - Panel 4: ${panelPrompts[3]}
    --ar 1:1`;
    // 2. 이미지 생성 기능은 사용하지 않고 텍스트 데이터만 반환
    const finalData = {
      ...textData,
      combinedPrompt: combinedPrompt, // Add combinedPrompt here
      images: [], // 이미지 생성 기능을 사용하지 않으므로 빈 배열 반환
    };

    return NextResponse.json(finalData);

  } catch (error) {
    console.error('Error in generate-comic API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
