import * as React from "react";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import type { BlogPost } from "~/types";
import BlogImg from "~/image/blog.jpg";
import { Heading } from "~/components/Heading";
import { BlogCard } from "~/components/BlogCard";
import { contentful } from "~/utils/contentful.server";

type LoaderData = {
  blogPosts: Omit<BlogPost, "content">[];
};

export async function loader() {
  const {
    blogPostsCollection: { items: blogPosts },
  } = await contentful(`{
    blogPostsCollection {
      items {
        title
        heroImage {
          url
        }
        date
        author {
          name
          avatar {
            url
          }
        }
      }
    }
  }`);

  return json<LoaderData>({
    blogPosts,
  });
}

export default function Index() {
  const [filter, setFilter] = React.useState("");
  const reducedMotion = useReducedMotion();
  const { blogPosts } = useLoaderData<LoaderData>();
  return (
    <div className="mx-auto flex min-h-screen max-w-screen-xl flex-col items-center gap-10">
      <div className="flex w-full items-center justify-center gap-9">
        <motion.img
          initial={{ opacity: 0.5, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: reducedMotion ? 0 : 0.5,
          }}
          src={BlogImg}
          alt=""
          className="hidden aspect-square h-80 border-4 border-brand object-cover drop-shadow-lg lg:block"
        />
        <div className="flex flex-col items-center gap-6 px-4 lg:items-start">
          <Heading>Blog</Heading>
          <p className="max-w-prose">
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry's standard dummy text
            ever since the 1500s, when an unknown printer took a galley of type
            and scrambled it to make a type specimen book.
          </p>
          <input
            type="text"
            className="rounded-full border-2 border-text bg-white/90 px-4 py-2 text-brand focus:border-brand focus:outline-none"
            placeholder="Filter blog posts"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-6">
        <AnimatePresence>
          {blogPosts
            .filter((post) =>
              post.title.toLowerCase().match(filter.toLowerCase())
            )
            .map((blogPost) => (
              <BlogCard
                key={blogPost.title}
                title={blogPost.title}
                date={blogPost.date}
                author={blogPost.author}
                heroImage={blogPost.heroImage}
              />
            ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
