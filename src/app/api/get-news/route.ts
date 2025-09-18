
import { NextResponse } from 'next/server';
import { parseStringPromise } from 'xml2js';

export async function GET() {
  try {
    const response = await fetch('http://www.yonhapnewstv.co.kr/browse/feed/');
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }
    const xmlText = await response.text();
    const result = await parseStringPromise(xmlText);

    const items = result.rss.channel[0].item;
    const newsItems = items.slice(0, 10).map((item: any) => ({
      title: item.title[0],
      link: item.link[0],
    }));

    return NextResponse.json({ news: newsItems, total: items.length });
  } catch (error) {
    console.error('Error fetching or parsing RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
