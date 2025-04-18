import React, { useEffect, useState } from 'react';
import { fetchTopStories, fetchItemsById } from '../utils/utils';
import { Link } from 'react-router-dom';
import { Triangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import pLimit from 'p-limit';

const fetchStories = async (concurrency = 50) => {
    const limit = pLimit(concurrency);
    try {
        const storyIds = await fetchTopStories();
        if (!storyIds) {
            throw newError('no response');
        }
        const storyPromise = storyIds.slice(0, 50).map((id) =>
            limit(async () => {
                const story = await fetchItemsById(id);
                if (!story) {
                    throw new Error('no response');
                    return null;
                }
                return {
                    id: story.id,
                    title: story.title,
                    url: story.url,
                    by: story.by,
                    kids: story.kids || [],
                    score: story.score,
                    time: `${new Date(story.time * 1000).getDate().toString().padStart(2, '0')}/${new Date(story.time * 1000).getMonth() + 1
                        }/${new Date(story.time * 1000).getFullYear()}`,
                };
            })
        );
        const stories = await Promise.all(storyPromise);
        if (stories) return stories;
    } catch (error) {
        console.error('Error fetching top stories:', error);
        return [];
    }
};

export default function Main() {
    const [topStories, setTopStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const limit = 10;
    const totalPages = topStories.length ? Math.ceil(topStories.length / limit) : 1;

    useEffect(() => {
        setLoading(true);
        fetchStories().then((newStories) => {
            setTopStories(newStories);
            setLoading(false);
            if (!newStories.length) {
                setError('Failed to load stories. Please refresh.');
            }
        });
    }, []);

    const prevPage = () => {
        if (page >= 2) {
            setPage((prev) => prev - 1);
        }
    };

    const prevPointer = () => {
        setPage(1);
    };

    const nextPointer = () => {
        setPage(totalPages);
    };

    const nextPage = () => {
        if (page < totalPages) {
            setPage((prev) => prev + 1);
        }
    };

    const pageWiseStories = topStories.slice((page - 1) * limit, page * limit);

    if (loading) {
        return (
            <div className="min-h-screen flex items-start justify-center">
                <p className="font-semibold lg:text-[1.3rem] text-lg animate-pulse">Loading...</p>
            </div>
        );
    }

    if (error && !topStories.length) {
        return (
            <div className="min-h-60 flex items-center justify-center">
                <p className="font-semibold lg:text-[1.3rem] text-lg text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen space-y-6 tracking-tight my-6 px-4 sm:px-6 lg:px-8">
            <div className="space-y-4 max-w-4xl mx-auto">
                {pageWiseStories.map((item) => (
                    <article
                        key={item.id}
                        className="p-4 border-[0.01rem] border-neutral-800 rounded-lg transition-all duration-200 hover:bg-[#FFFFFF] hover:shadow-sm"
                    >
                        <div className="space-y-3">
                            <h2 className="font-semibold lg:text-[1.15rem] text-lg leading-tight">
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:ring-opacity-50"
                                >
                                    {item.title}
                                </a>
                            </h2>
                            <p className="text-sm lg:text-base text-gray-800">
                                by{' '}
                                <Link
                                    to={`/users/${item.by}`}
                                    className="text-[#121212] underline underline-offset-4 hover:text-gray-600 transition-colors"
                                >
                                    {item.by}
                                </Link>
                            </p>
                            <div className="text-sm lg:text-base flex items-center gap-2 text-gray-800 flex-wrap">
                                <Link
                                    to={`/story/${item.id}`}
                                    className="text-[#121212] hover:underline underline-offset-4"
                                >
                                    {item.kids.length} comments
                                </Link>
                                <span className="text-gray-400">|</span>
                                <span className="flex items-center gap-1">
                                    <Triangle size={12} className="fill-current" /> {item.score} Score
                                </span>
                                <span className="text-gray-400">|</span>
                                <span>{item.time}</span>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
            {topStories.length > 0 && (
                <nav
                    className="flex justify-center items-center gap-3 py-4 max-w-4xl mx-auto"
                    aria-label="Pagination"
                >
                    <button
                        onClick={prevPointer}
                        disabled={page === 1}
                        className="flex items-center justify-center rounded-lg h-10 w-10 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Go to first page"
                    >
                        <ChevronsLeft size={18} />
                    </button>
                    <button
                        onClick={prevPage}
                        disabled={page === 1}
                        className="flex items-center justify-center rounded-lg h-10 w-10 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous page"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-base font-medium">
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={nextPage}
                        disabled={page === totalPages}
                        className="flex items-center justify-center rounded-lg h-10 w-10 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Next page"
                    >
                        <ChevronRight size={18} />
                    </button>
                    <button
                        onClick={nextPointer}
                        disabled={page === totalPages}
                        className="flex items-center justify-center rounded-lg h-10 w-10 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Go to last page"
                    >
                        <ChevronsRight size={18} />
                    </button>
                </nav>
            )}
        </main>
    );
}