'use client';

import { useState } from 'react';

import { IMAGE_STYLES, PANEL_COLORS } from '../constants';

import { useComicGenerator } from '../hooks/useComicGenerator';

export default function Home() {
  const {
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
    error,
  } = useComicGenerator();

  const [activeTone, setActiveTone] = useState<'expository' | 'interrogative'>('expository');

  return (
    <main className="flex min-h-screen flex-col items-center p-6 sm:p-12 bg-gray-50">
      <div className="w-full max-w-3xl">
        <header className="text-center mb-8">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-2 font-poppins">Gleam News</h1>
          <p className="text-md sm:text-lg text-gray-600">AI 프롬프트로 만나는 AI 뉴스 이미지</p>
        </header>

        <form onSubmit={handleSubmit} className="mb-8">
          <button
            type="button"
            onClick={() => setShowStyleSelector(!showStyleSelector)}
            className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-300 transition-colors text-base"
          >
            {showStyleSelector ? '스타일 선택 닫기' : '스타일 선택 열기'}
          </button>

          {showStyleSelector && (
            <>
              <div className="mb-4 mt-4">
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
            </>
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
            {loading ? 'AI가 이미지를 생성하는 중...' : '글림뉴스 생성하기'}
          </button>
        </form>

        {error && (
          <div className="text-center p-4 mb-8 bg-red-100 border border-red-400 text-red-700 rounded-lg" role="alert">
            <p className="font-bold">오류 발생:</p>
            <p>{error}</p>
          </div>
        )}

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
                  <span key={index} className={`px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm`}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-center items-center gap-2 mb-4">
              <button
                onClick={() => setActiveTone('expository')}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                  activeTone === 'expository'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                A 설명형
              </button>
              <button
                onClick={() => setActiveTone('interrogative')}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                  activeTone === 'interrogative'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ? 질문형
              </button>
            </div>

            {mainImagePrompt && (
              <div className="mb-4 p-3 bg-gray-100 rounded-lg shadow-sm">
                <p className="text-sm font-semibold text-gray-700 mb-1">메인 이미지 프롬프트:</p>
                <p className="text-xs text-gray-600 break-all">{mainImagePrompt}</p>
                {simpleMainImagePrompt && (
                  <p className="text-xs text-gray-500 mt-1 break-all">간결한 프롬프트: {simpleMainImagePrompt}</p>
                )}
              </div>
            )}

            {prompts && (
              <button
                onClick={() => handleDownload({
                  articleTitle, tags, summary, captions, prompts,
                  mainImagePrompt, originalArticleInput,
                  simplePrompts, simpleMainImagePrompt, isUrl
                })}
                className="w-full mb-6 px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition-colors text-lg"
              >
                프롬프트 다운로드
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {summary.map((cutSummary, index) => (
                <div key={index} className={`border-2 border-gray-200 p-4 rounded-lg shadow aspect-square flex flex-col justify-center items-center ${PANEL_COLORS[index % PANEL_COLORS.length]}`}>
                  <p className="text-sm font-medium text-gray-500 mb-2">컷 #{index + 1}</p>
                  <h3 className="text-xl font-bold text-gray-800 text-center mb-3">{cutSummary}</h3>
                  {captions && captions[index] && (
                    <p className="text-md text-gray-700 text-center italic">
                      &quot;{captions[index][activeTone]}&quot;
                    </p>
                  )}
                  {prompts && <p className="text-xs text-gray-500 text-center mt-2 break-all">프롬프트: {prompts[index]}</p>}
                </div>
              ))}
            </div>
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