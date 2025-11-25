import type { Metadata } from "next";
import { SHARE_BANNER_IMAGE } from "./shareConfig";

const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : `http://localhost:${process.env.PORT || 3000}`;
const titleTemplate = "%s | helper 2";

export const getMetadata = ({
  title,
  description,
  imageRelativePath,
}: {
  title: string;
  description: string;
  imageRelativePath?: string;
}): Metadata => {
  const imageUrl = imageRelativePath ? `${baseUrl}${imageRelativePath}` : SHARE_BANNER_IMAGE;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: title,
      template: titleTemplate,
    },
    description: description,
    openGraph: {
      title: {
        default: title,
        template: titleTemplate,
      },
      description: description,
      images: [
        {
          url: imageUrl,
        },
      ],
    },
    twitter: {
      title: {
        default: title,
        template: titleTemplate,
      },
      description: description,
      images: [imageUrl],
    },
    icons: {
      icon: [
        {
          url: "/shadow-logo.png",
          sizes: "256x256",
          type: "image/png",
        },
      ],
    },
  };
};
