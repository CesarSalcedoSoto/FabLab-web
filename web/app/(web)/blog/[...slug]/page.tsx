import { PostDetailPage } from "@/features/blog/presentation/pages/post-detail-page";
import type { Metadata } from "next";

type Props = {
    params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const fullSlug = slug.join("/");

    return {
        title: `${fullSlug.split("/").pop()?.replace(/-/g, " ") || "Post"} | Blog FabLab INACAP`,
        description: "Lee este artículo en el blog del FabLab INACAP Los Ángeles.",
        openGraph: {
            title: "Blog FabLab INACAP",
            type: "article",
            locale: "es_CL",
        },
    };
}

export default async function BlogPostRoute({ params }: Props) {
    const { slug } = await params;
    // Reconstruct the full slug from path segments (e.g. ["2026","02","mi-post"] → "2026/02/mi-post")
    const fullSlug = slug.join("/");

    return <PostDetailPage slug={fullSlug} />;
}
