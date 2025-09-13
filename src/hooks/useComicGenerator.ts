'use client';

import { useState } from 'react';
import { IMAGE_STYLES } from '../constants'; // Assuming IMAGE_STYLES is needed here for initial state

interface PanelCaptions {
  expository: string;
  interrogative: string;
}

interface DownloadData {
  articleTitle: string | null;
  tags: string[] | null;
  summary: string[] | null;
  captions: PanelCaptions[] | null;
  prompts: string[] | null;
  mainImagePrompt: string | null;
  originalArticleInput: string | null;
  simplePrompts: string[] | null;
  simpleMainImagePrompt: string | null;
  isUrl: boolean;
}

interface ComicGeneratorResult {
  article: string;
  setArticle: (article: string) => void;
  selectedStyle: string;
  setSelectedStyle: (style: string) => void;
  loading: boolean;
  showStyleSelector: boolean;
  setShowStyleSelector: (show: boolean) => void;
  summary: string[] | null;
  prompts: string[] | null;
  simplePrompts: string[] | null;
  captions: PanelCaptions[] | null;
  articleTitle: string | null;
  tags: string[] | null;
  mainImagePrompt: string | null;
  simpleMainImagePrompt: string | null;
  originalArticleInput: string | null;
  isUrl: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleClear: () => void;
  handleDownload: (data: Omit<DownloadData, 'combinedPromptText' | 'simpleCombinedPrompt'>) => void;
  error: string | null;
}

export function useComicGenerator(): ComicGeneratorResult {
  const [article, setArticle] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(IMAGE_STYLES[0].value);
  const [loading, setLoading] = useState(false);
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [summary, setSummary] = useState<string[] | null>(null);
  const [prompts, setPrompts] = useState<string[] | null>(null);
  const [simplePrompts, setSimplePrompts] = useState<string[] | null>(null);
  const [captions, setCaptions] = useState<PanelCaptions[] | null>(null);
  const [articleTitle, setArticleTitle] = useState<string | null>(null);
  const [tags, setTags] = useState<string[] | null>(null);
  const [mainImagePrompt, setMainImagePrompt] = useState<string | null>(null);
  const [simpleMainImagePrompt, setSimpleMainImagePrompt] = useState<string | null>(null);
  const [originalArticleInput, setOriginalArticleInput] = useState<string | null>(null);
  const [isUrl, setIsUrl] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = (data: Omit<DownloadData, 'combinedPromptText' | 'simpleCombinedPrompt'>) => { // Updated signature
    console.log('handleDownload: Function called.');
    const {
      articleTitle, tags, summary, captions, prompts,
      mainImagePrompt, originalArticleInput,
      simplePrompts, simpleMainImagePrompt, isUrl
    } = data; // Destructure data object

    if (!articleTitle || !tags || !summary || !captions || !prompts || !mainImagePrompt || !originalArticleInput || !simplePrompts || !simpleMainImagePrompt) {
      console.log('handleDownload: Missing data, returning.');
      return;
    }
    console.log('handleDownload: All data present.');

    let content = '';

    // Article Info
    if (isUrl) { // Use destructured isUrl
      content += `## 기사 출처 URL: ${originalArticleInput}\n\n`; // Use destructured originalArticleInput
    } else {
      content += `## 원본 기사 내용:\n${originalArticleInput}\n\n`; // Use destructured originalArticleInput
    }
    content += `## 기사 제목: ${articleTitle}\n\n`; // Use destructured articleTitle
    if (tags && tags.length > 0) { // Use destructured tags
      content += `### 태그: ${tags.join(', ')}\n\n`;
    }

    content += `---\n\n`; // Separator

    // Main Image Prompt (assuming "메인 제목 프롬프트" means "메인 이미지 프롬프트")
    content += `### 메인 이미지 프롬프트: ${mainImagePrompt}\n`; // Use destructured mainImagePrompt
    content += `### 간결한 메인 이미지 프롬프트: ${simpleMainImagePrompt}\n\n`; // Use destructured simpleMainImagePrompt

    content += `---\n\n`; // Separator

    // Individual Panel Prompts
    summary.forEach((cutSummary, index) => { // Use destructured summary
      const panelTitle = cutSummary; // Assuming cutSummary is the panel title
      const expositoryCaption = captions && captions[index] ? captions[index].expository : '';
      const interrogativeCaption = captions && captions[index] ? captions[index].interrogative : '';
      const panelPrompt = prompts && prompts[index] ? prompts[index] : ''; // Use destructured prompts
      const simplePanelPrompt = simplePrompts && simplePrompts[index] ? simplePrompts[index] : ''; // Use destructured simplePrompts

      content += `### 컷${index + 1} (제목: ${panelTitle})\n`;
      content += `- 설명: ${expositoryCaption}\n`;
      content += `- 질문: ${interrogativeCaption}\n`;
      content += `- 프롬프트: ${panelPrompt}\n`;
      if (simplePanelPrompt) {
        content += `- 간결한 프롬프트: ${simplePanelPrompt}\n`;
      }
      content += `\n`;
    });

    console.log('handleDownload: Content generated.');
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    console.log('handleDownload: Blob created.');
    const url = URL.createObjectURL(blob);
    console.log('handleDownload: URL created.');

    const link = document.createElement('a');
    link.href = url;
    const fileName = `${articleTitle.replace(/[^a-z0-9가-힣]/gi, '_')}.txt`; // Use destructured articleTitle
    link.download = fileName;
    document.body.appendChild(link);
    console.log('handleDownload: Link appended.');
    link.click();
    console.log('handleDownload: Link clicked.');
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('handleDownload: Download process completed.');
  };

  const handleClear = () => {
    setArticle('');
    setSelectedStyle(IMAGE_STYLES[0].value);
    setLoading(false);
    setSummary(null);
    setPrompts(null);
    setSimplePrompts(null);
    setCaptions(null);
    setArticleTitle(null);
    setTags(null);
    setMainImagePrompt(null);
    setSimpleMainImagePrompt(null);
    setOriginalArticleInput(null); // Clear original article input as well
    setIsUrl(false); // Clear URL status
    setError(null); // Clear error on clear
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSummary(null);
    setPrompts(null);
    setSimplePrompts(null);
    setCaptions(null);
    setArticleTitle(null);
    setTags(null);
    setMainImagePrompt(null);
    setSimpleMainImagePrompt(null);
    setOriginalArticleInput(null); // Clear original article input before new submission
    setIsUrl(false); // Clear URL status before new submission
    setError(null); // Clear error on new submission

    try {
      const response = await fetch('/api/generate-comic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ article, selectedStyle }),
      });

      const data = await response.json();
      console.log('API Response Data:', data);

      if (!response.ok) {
        throw new Error(data.error || '알 수 없는 에러가 발생했습니다.');
      }

      setSummary(data.summary);
      setCaptions(data.captions);
      setPrompts(data.prompts);
      setSimplePrompts(data.simplePrompts);
      setArticleTitle(data.articleTitle);
      setTags(data.tags);
      setMainImagePrompt(data.mainImagePrompt);
      setSimpleMainImagePrompt(data.simpleMainImagePrompt);
      setOriginalArticleInput(data.originalArticleInput);
      setIsUrl(data.isUrl);

    } catch (err) {
      console.error('Error during comic generation:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    article,
    setArticle,
    selectedStyle,
    setSelectedStyle,
    loading,
    showStyleSelector,
    setShowStyleSelector,
    summary,
    prompts,
    simplePrompts,
    captions,
    articleTitle,
    tags,
    mainImagePrompt,
    simpleMainImagePrompt,
    originalArticleInput,
    isUrl,
    handleSubmit,
    handleClear,
    handleDownload,
    error, // Expose error state
  };
}
