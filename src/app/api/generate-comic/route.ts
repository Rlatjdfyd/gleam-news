// app/api/generate-comic/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getComicGeneratorPrompt } from '../../../prompts/comicGeneratorPrompt'; // Corrected path

function isValidUrl(string: string) {
  try {
    new URL(string);
    return true;
  } catch { // Removed 'e'
    return false;
  }
}

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Failed to fetch URL content from ${url}:`, error);
    throw new Error(`URL content fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

interface Panel {
  summary: string;
  prompt: string;
  simple_prompt: string;
  captions: {
    expository: string;
    interrogative: string;
  };
}

async function generateTextData(apiKey: string, article: string, imageStyle: string, aspectRatio: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const metaPrompt = getComicGeneratorPrompt(imageStyle, article, aspectRatio);
    

  const result = await model.generateContent(metaPrompt);
  const response = result.response;
  const jsonString = response.text();
  
  let parsedJson;
  try {
    // Attempt to parse directly first
    parsedJson = JSON.parse(jsonString);
  } catch { // Removed 'e'
    // If direct parsing fails, try to extract JSON using regex
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (!jsonMatch || !jsonMatch[0]) {
      throw new Error('AI 응답에서 유효한 JSON을 찾을 수 없습니다. 원본 응답: ' + jsonString);
    }
    const cleanedJsonString = jsonMatch[0];
    try {
      parsedJson = JSON.parse(cleanedJsonString);
    } catch { // Removed 'e2'
      throw new Error('추출된 JSON 문자열을 파싱할 수 없습니다. 추출된 문자열: ' + cleanedJsonString + ' 원본 응답: ' + jsonString);
    }
  }
  return parsedJson;
}



export async function POST(request: Request) {
  try {
    const { article, selectedStyle, selectedAspectRatio } = await request.json();
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error('Google API key is not configured.');
    }

    if (!article) {
      return NextResponse.json({ error: 'Article content is required.' }, { status: 400 });
    }

    let processedArticle: string = article || '';
    let isUrl: boolean = false;
    let originalArticleInput: string = article || '';

    if (isValidUrl(article)) {
      isUrl = true;
      originalArticleInput = article;
      try {
        processedArticle = await fetchUrlContent(article);
      } catch (error) {
        return NextResponse.json({ error: `Failed to fetch article from URL: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
      }
    } else {
      originalArticleInput = article;
    }

    // 1. 텍스트 데이터 (프롬프트 포함) 생성
    const textData = await generateTextData(apiKey, processedArticle, selectedStyle, selectedAspectRatio);

    // 2. 텍스트 데이터 재구성
    const { title, main_prompt, simple_main_prompt, panels, tags } = textData;

    const summary = panels.map((p: Panel) => p.summary);
    const prompts = panels.map((p: Panel) => p.prompt);
    const simplePrompts = panels.map((p: Panel) => p.simple_prompt);
    const captions = panels.map((p: Panel) => p.captions); // This will be an array of {expository, interrogative} objects

    const finalData = {
      articleTitle: title,
      summary: summary,
      captions: captions, // Array of {expository, interrogative} objects
      prompts: prompts,
      simplePrompts: simplePrompts,
      tags: tags,
      mainImagePrompt: main_prompt, // Use AI-generated main prompt
      simpleMainImagePrompt: simple_main_prompt, // Use AI-generated simple main prompt
      originalArticleInput: originalArticleInput,
      isUrl: isUrl,
      images: [], // 이미지 생성 기능을 사용하지 않으므로 빈 배열 반환
    };

    return NextResponse.json(finalData);

  } catch (error) {
    let errorMessage = '알 수 없는 서버 오류가 발생했습니다.';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      // Specific error handling for known issues
      if (errorMessage.includes('Google API key is not configured')) {
        statusCode = 500; // Or 401 if you want to distinguish
      } else if (errorMessage.includes('Article content is required')) {
        statusCode = 400;
      } else if (errorMessage.includes('URL content fetch failed')) {
        statusCode = 500;
      } else if (errorMessage.includes('AI 응답에서 유효한 JSON을 찾을 수 없습니다') || errorMessage.includes('추출된 JSON 문자열을 파싱할 수 없습니다')) {
        statusCode = 500; // AI response parsing error
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    console.error('API Error in /api/generate-comic:', error); // Log full error for debugging
    return NextResponse.json({ error: `서버 오류: ${errorMessage}` }, { status: statusCode });
  }
}