import { clsx, type ClassValue } from "clsx";
import { Metadata } from "next";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteURL(path: string) {
  if (typeof window !== "undefined") {
    //means we are on client side
    return path;
  }

  if (process.env.VERCEL_URL) {
    //which means that we have deployed our app to the vercel
    return `https://${process.env.VERCEL_URL}${path}`;
  }

  return `http://localhost:${process.env.PORT ?? 3000}${path}`;
}

export function constructMetadata({
  title = "Talk2PDF",
  description = "Talk2PDF is an open-source software to make chatting to your PDF files easy.",
  image = "/thumbnail.png",
  icons = "/favicon.ico",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "",
    },
    icons,
    metadataBase: new URL("http://localhost:3000/"),
    themeColor: "#FFF",
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
