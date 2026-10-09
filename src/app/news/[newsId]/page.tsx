import Image from 'next/image';
import { notFound } from 'next/navigation';

type StructuredText =
    | string
    | {
          text?: string;
          blocks?: StructuredText[];
          model?: StructuredText;
          [key: string]: unknown;
      }
    | unknown[]
    | null
    | undefined;

interface NewsArticle {
    id: string;
    title: string;
    description: StructuredText;
    link?: string;
    imageUrl?: string;
    imageAlt?: string | null;
    category?: string | null;
    type?: string;
    isLive?: boolean;
    firstPublished: string;
    lastPublished: string;
    source: string;
    text: string;
}

interface NewsDetailsResponse {
    success: boolean;
    count: number;
    cachedAt: string;
    data: NewsArticle | null;
}

const getTextFromStructuredContent = (value: StructuredText): string => {
    if (typeof value === 'string') {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map((item) => getTextFromStructuredContent(item as StructuredText)).filter(Boolean).join(' ');
    }

    if (!value || typeof value !== 'object') {
        return '';
    }

    const record = value as Record<string, unknown>;

    if (typeof record.text === 'string') {
        return record.text;
    }

    if (Array.isArray(record.blocks)) {
        return getTextFromStructuredContent(record.blocks as StructuredText);
    }

    if (record.model) {
        return getTextFromStructuredContent(record.model as StructuredText);
    }

    return Object.values(record)
        .map((item) => getTextFromStructuredContent(item as StructuredText))
        .filter(Boolean)
        .join(' ');
};

const NewsDetails = async ({
    params,
}: {
    params: Promise<{ newsId: string }>;
}) => {
    const { newsId } = await params;

    const res = await fetch(
        `https://news-api-v2.vercel.app/api/article/${newsId}`,
        {
            next: {
                revalidate: 60,
            },
        }
    );

    if (!res.ok) {
        notFound();
    }

    const data: NewsDetailsResponse = await res.json();

    const news = data.data;

    if (!news) {
        notFound();
    }

    const articleDescription = getTextFromStructuredContent(news.text) || news.title;
    const articleCategory = news.category || 'সাধারণ';
    const articleImage = news.imageUrl || '/placeholder.svg';
    const articleImageAlt = news.imageAlt || news.title;

    const publishedDate = new Date(
        news.firstPublished
    ).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const publishedTime = new Date(
        news.firstPublished
    ).toLocaleTimeString('bn-BD', {
        hour: 'numeric',
        minute: '2-digit',
    });

    return (
        <main className="bg-white">
            <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">

                {/* Category */}
                <div className="mb-5 flex items-center gap-3">
                    <span className="rounded-full bg-red-50 px-4 py-1.5 text-sm font-bold text-red-700">
                        {articleCategory}
                    </span>

                    {news.isLive && (
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
                            লাইভ
                        </span>
                    )}
                </div>

                {/* Headline */}
                <h1 className="max-w-4xl text-3xl font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">
                    {news.title}
                </h1>

                {/* Description / Summary
                <p className="mt-6 max-w-4xl text-lg leading-8 text-neutral-600 sm:text-xl">
                    {articleDescription}
                </p> */}

                {/* Meta information */}
                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-neutral-200 py-4 text-sm text-neutral-500">
                    <span className="font-semibold text-neutral-700">
                        {news.source}
                    </span>

                    <span className="hidden h-1 w-1 rounded-full bg-neutral-300 sm:block" />

                    <span>
                        প্রকাশিত: {publishedDate}
                    </span>

                    <span className="hidden h-1 w-1 rounded-full bg-neutral-300 sm:block" />

                    <span>{publishedTime}</span>
                </div>

                {/* Hero Image */}
                <figure className="mt-8 overflow-hidden rounded-2xl bg-neutral-100 shadow-sm">
                    <Image
                        src={articleImage}
                        alt={articleImageAlt}
                        width={1200}
                        height={675}
                        priority
                        className="h-auto w-full object-cover"
                    />

                    {news.imageAlt && (
                        <figcaption className="border-t bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-500 sm:px-6">
                            {news.imageAlt}
                        </figcaption>
                    )}
                </figure>

                {/* Article Content */}
                <div className="mx-auto mt-10 max-w-3xl">
                    <div className="prose prose-lg max-w-none text-neutral-800">
                        <p className="leading-9">
                            {articleDescription}
                        </p>
                    </div>

                    {/* Source */}
                    <div className="mt-10 border-t border-neutral-200 pt-6">
                        <div className="flex flex-col gap-2 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
                            <span>
                                সূত্র: <strong className="text-neutral-700">
                                    {news.source}
                                </strong>
                            </span>

                            <span>
                                সর্বশেষ আপডেট:{" "}
                                {new Date(news.lastPublished).toLocaleDateString(
                                    'bn-BD',
                                    {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    }
                                )}
                            </span>
                        </div>
                    </div>
                </div>

            </article>
        </main>
    );
};

export default NewsDetails;