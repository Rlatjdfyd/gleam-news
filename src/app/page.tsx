'use client';

import { useState } from 'react';

export default function Home() {
  const IMAGE_STYLES = [
    { name: '픽사 스타일', value: 'vibrant and expressive Pixar animation style' },
    { name: '지브리 스타일', value: 'whimsical and fantastical style of Studio Ghibli' },
    { name: '카툰 네트워크 스타일', value: 'bold and quirky Cartoon Network animation style' },
    { name: '아메리칸 코믹스 스타일', value: 'dynamic and bold American comic book style' },
    { name: '유럽 만화 (방드 데시네) 스타일', value: 'detailed and elegant European comic (bande dessinée) style' },
    { name: '한국 수묵화 스타일', value: 'traditional Korean ink wash painting style, serene and artistic' },
    { name: '애니메이션 스타일', value: 'anime style' },
    { name: '픽셀 아트 스타일', value: 'pixel art style' },
    { name: '수채화 스타일', value: 'watercolor painting style' },
  ];

  const [article, setArticle] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(IMAGE_STYLES[0].value);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string[] | null>(null);
  const [prompts, setPrompts] = useState<string[] | null>(null);
  const [captions, setCaptions] = useState<string[] | null>(null);
  const [articleTitle, setArticleTitle] = useState<string | null>(null);
  const [mainImagePrompt, setMainImagePrompt] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('프롬프트가 복사되었습니다!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSummary(null);
    setPrompts(null);

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
        // 서버가 보낸 상세 에러 메시지를 사용
        throw new Error(data.error || '알 수 없는 에러가 발생했습니다.');
      }

      setSummary(data.summary);
          setCaptions(data.captions);
          setPrompts(data.prompts);
          setArticleTitle(data.articleTitle);
          setMainImagePrompt(data.mainImagePrompt);
    } catch (error) {
      console.error(error);
      // 에러 객체의 메시지를 경고창에 표시
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
          <h1 className="text-6xl sm:text-7xl font-bold mb-2 font-poppins">Gleam News</h1>
          <p className="text-md sm:text-lg text-gray-600">AI 프롬프트로 만나는 네컷 뉴스</p>
        </header>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <label htmlFor="image-style" className="block text-lg font-medium text-gray-700 mb-2">이미지 스타일 선택:</label>
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
            {loading ? '프롬프트를 생성하는 중...' : 'AI 프롬프트 생성하기'}
          </button>
        </form>

        {loading && (
          <div className="text-center p-8">
            <p className="text-lg">AI가 기사를 분석하고 있습니다...</p>
            <p className="text-sm text-gray-600">최고의 프롬프트를 만들기 위해 잠시만 기다려주세요!</p>
          </div>
        )}

        {summary && prompts && articleTitle && mainImagePrompt && (
          <section>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center">{articleTitle}</h2>
            <div className="bg-gray-100 p-3 rounded-md mb-6">
              <p className="text-sm text-gray-500 mb-2">⬇️ 전체 기사 테마 배경 이미지 프롬프트:</p>
              <p className="font-mono text-sm text-gray-700 leading-relaxed">{mainImagePrompt}</p>
              <button
                onClick={() => handleCopy(mainImagePrompt)}
                className="w-full mt-3 px-3 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-sm hover:bg-green-600 transition-colors text-sm"
              >
                프롬프트 복사하기
              </button>
            </div>
            <div className="space-y-6">
              {summary.map((caption, index) => (
                <div key={index} className="border-2 border-gray-200 p-4 rounded-lg bg-white shadow">
                  <h3 className="text-lg font-semibold mb-2 text-gray-800">🎬 컷 #{index + 1}: {caption}</h3>
                  {captions && <p className="text-md text-gray-700 mb-3">{captions[index]}</p>} {/* Add this line */}
                  <div className="bg-gray-100 p-3 rounded-md">
                    <p className="text-sm text-gray-500 mb-2">⬇️ 아래 프롬프트를 복사해서 이미지 생성 AI에 사용해 보세요.</p>
                    <p className="font-mono text-sm text-gray-700 leading-relaxed">{prompts[index]}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(prompts[index])}
                    className="w-full mt-3 px-3 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-sm hover:bg-green-600 transition-colors text-sm"
                  >
                    프롬프트 복사하기
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
