'use client';

import { useState } from 'react';

export default function Home() {
  const IMAGE_STYLES = [
    { name: '미니어처 디오라마 스타일', value: 'tilt-shift photography, miniature effect, diorama style' },
    { name: '한국 수묵화 스타일', value: 'traditional Korean ink wash painting style, serene and artistic' },
    { name: '애니메이션 스타일', value: 'anime style' },
    { name: '픽셀 아트 스타일', value: 'pixel art style' },
    { name: '수채화 스타일', value: 'watercolor painting style' },
  ];

  const [article, setArticle] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(IMAGE_STYLES[0].value);
  const [loading, setLoading] = useState(false);
  const [showStyleSelector, setShowStyleSelector] = useState(false); // Add this line
  const [summary, setSummary] = useState<string[] | null>(null);
  const [prompts, setPrompts] = useState<string[] | null>(null); // Keep for download
  const [captions, setCaptions] = useState<string[] | null>(null);
  const [articleTitle, setArticleTitle] = useState<string | null>(null);
  const [tags, setTags] = useState<string[] | null>(null);
  const [mainImagePrompt, setMainImagePrompt] = useState<string | null>(null); // Re-add this line
  const [combinedPromptText, setCombinedPromptText] = useState<string | null>(null); // Add this line
  const [originalArticleInput, setOriginalArticleInput] = useState<string | null>(null); // Add this line
  const [isUrl, setIsUrl] = useState<boolean>(false); // Add this line

  const handleDownload = () => {
    if (!articleTitle || !tags || !summary || !captions || !prompts || !mainImagePrompt || !combinedPromptText || !originalArticleInput) return; // Add originalArticleInput to check

    let content = '';

    if (isUrl) {
      content += `기사 출처 URL: ${originalArticleInput}\n\n`;
    } else {
      content += `원본 기사 내용:\n${originalArticleInput}\n\n`;
    }

    content += `기사 제목: ${articleTitle}\n\n`;
    
    if (tags && tags.length > 0) {
      content += `태그: ${tags.join(', ')}\n\n`;
    }

    // Re-add mainImagePrompt here
    content += `메인 이미지 프롬프트: ${mainImagePrompt}\n\n`;

    // Add combinedPromptText here
    content += `통합 패널 프롬프트: ${combinedPromptText}\n\n`;

    content += '---'.repeat(10) + '\n\n';

    summary.forEach((cutSummary, index) => {
      content += `🎬 컷 #${index + 1}: ${cutSummary}\n`;
      if (captions && captions[index]) {
        content += `요약: ${captions[index]}\n`;
      }
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const fileName = `${articleTitle.replace(/[^a-z0-9가-힣]/gi, '_')}.txt`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click(); // Use link.click() for PC
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setArticle('');
    setSelectedStyle(IMAGE_STYLES[0].value); // Reset to default style
    setLoading(false);
    setSummary(null);
    setPrompts(null);
    setCaptions(null);
    setArticleTitle(null);
    setTags(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSummary(null);
    setPrompts(null);
    setCaptions(null);
    setArticleTitle(null);
    setTags(null);

    try {
      const response = await fetch('/api/generate-comic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ article, selectedStyle }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '알 수 없는 에러가 발생했습니다.');
      }

      setSummary(data.summary);
      setCaptions(data.captions);
      setPrompts(data.prompts);
      setArticleTitle(data.articleTitle);
      setTags(data.tags);
      setMainImagePrompt(data.mainImagePrompt); // Re-add this line
      setCombinedPromptText(data.combinedPrompt); // Add this line
      setOriginalArticleInput(data.originalArticleInput); // Add this line
      setIsUrl(data.isUrl); // Add this line

    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        alert(`오류 발생: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 sm:p-12 bg-gray-50">
      <div className="w-full max-w-3xl">
        <header className="text-center mb-8">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-2 font-poppins">Gleam News</h1>
          <p className="text-md sm:text-lg text-gray-600">AI 프롬프트로 만나는 네컷 뉴스</p>
        </header>

        <form onSubmit={handleSubmit} className="mb-8">
          {/* Toggle button for style selection */}
          <button
            type="button" // Important: not submit
            onClick={() => setShowStyleSelector(!showStyleSelector)}
            className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-300 transition-colors text-base"
          >
            {showStyleSelector ? '스타일 선택 닫기' : '스타일 선택 열기'}
          </button>

          {showStyleSelector && (
            <> {/* Added fragment */}
              <div className="mb-4 mt-4"> {/* Added mt-4 for spacing */}
                {/* Removed label for image style selection */}
                <select
                  id="image-style"
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 transition text-base"
                >
                  {IMAGE_STYLES.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.name}
                    </option>
                  ))}
                </select>
              </div>
            </> // Added fragment
          )}
          <textarea
            value={article}
            onChange={(e) => setArticle(e.target.value)}
            placeholder="여기에 뉴스 기사 URL을 붙여넣거나 내용을 입력하세요..."
            className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 transition text-base"
            rows={6}
          />
          <button
            type="submit"
            disabled={loading || !article}
            className="w-full mt-4 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-lg"
          >
            {loading ? 'AI가 만화를 생성하는 중...' : '글램뉴스 생성하기'}
          </button>
        </form>

        {loading && (
          <div className="text-center p-8">
            <p className="text-lg">AI가 기사를 분석하고 이미지를 생성하고 있습니다...</p>
            <p className="text-sm text-gray-600">최대 1~2분 정도 소요될 수 있습니다. 잠시만 기다려주세요!</p>
          </div>
        )}

        {summary && articleTitle && (
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center">{articleTitle}</h2>
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {prompts && (
              <button
                onClick={handleDownload}
                className="w-full mb-6 px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-colors text-lg"
              >
                프롬프트 다운로드
              </button>
            )}

            {/* No image display */}

            {/* Display summary and captions as a list */}
            <div className="space-y-6">
              {summary.map((cutSummary, index) => (
                <div key={index} className="border-2 border-gray-200 p-4 rounded-lg bg-white shadow">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">• 컷 #{index + 1}: {cutSummary}</h3>
                  {captions && <p className="text-md text-gray-700 mt-3">{captions[index]}</p>}
                </div>
              ))}
            </div>
            {/* Add the new Clear button here */}
            <button
              onClick={handleClear}
              className="w-full mt-6 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors text-lg"
            >
              화면 지우기
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
