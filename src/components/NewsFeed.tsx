'use client';

import { useState, useEffect } from 'react';

interface NewsItem {
  title: string;
  link: string;
}

export default function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        const response = await fetch('/api/get-news');
        if (!response.ok) {
          throw new Error('뉴스를 불러오는 데 실패했습니다.');
        }
        const data = await response.json();
        setNews(data.news);
        setTotal(data.total);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

  return (
    <section className="w-full">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        연합뉴스 주요뉴스 {news.length > 0 && `(${news.length} / ${total}개)`}
      </h2>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm" style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {loading && <p className="text-gray-500">뉴스를 불러오는 중...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {news.length > 0 && (
          <ul className="space-y-3">
            {news.map((item, index) => (
              <li key={index}>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline hover:text-blue-800 transition-colors"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}