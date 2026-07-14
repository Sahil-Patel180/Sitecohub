import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { WebsiteData } from '../data/mockData';
import { fetchAllSites } from '../data/fetchSites';
import DetailView from '../components/DetailView';

export default function SiteDetail() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    const [allSites, setAllSites] = useState<WebsiteData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllSites()
            .then(setAllSites)
            .catch((err) => console.error('Failed to fetch sites:', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="pt-8 md:pt-20 px-4 md:px-6 max-w-7xl mx-auto pb-12 md:pb-20 text-center text-[#666]">
                Loading…
            </div>
        );
    }

    const site = allSites.find((s) => s.slug === slug);

    if (!site) {
        return (
            <div className="pt-8 md:pt-20 px-4 md:px-6 max-w-7xl mx-auto pb-12 md:pb-20 text-center">
                <p className="text-[#888] mb-4">Site not found.</p>
                <Link to="/showcase" className="text-white underline">
                    Back to Showcase
                </Link>
            </div>
        );
    }

    return (
        <DetailView
            site={site}
            allSites={allSites}
            onClose={() => navigate('/showcase')}
        />
    );
}