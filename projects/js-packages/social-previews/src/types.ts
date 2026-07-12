import type { Hyperlink } from './helpers';
import type { SectionHeadingProps } from './shared/section-heading';

export interface SocialPreviewBaseProps {
	/**
	 * The URL of the post/page to preview.
	 */
	url: string;

	/**
	 * Editor hyperlinks rendered over the matching body text on the networks
	 * that support inline links (Bluesky, Tumblr). Other networks ignore this.
	 */
	hyperlinks?: Hyperlink[];

	/**
	 * The title of the post/page to preview.
	 */
	title: string;

	/**
	 * The description of the post/page to preview.
	 */
	description?: string;

	/**
	 * The URL of the image to use in the post/page preview.
	 */
	image?: string;

	/**
	 * The focal point of the link-preview image (`image`/`customImage`), both
	 * axes 0-1. When set, the preview crops around this point via
	 * `object-position`. Omitted → centered, matching today's behavior.
	 */
	imageFocalPoint?: FocalPoint;

	/**
	 * The array of media items to use in the preview.
	 */
	media?: Array< MediaItem >;

	/**
	 * The caption.
	 */
	caption?: string;
}

export interface SocialPreviewsBaseProps {
	/**
	 * The heading level to use for the preview section title
	 */
	headingLevel?: SectionHeadingProps[ 'level' ];

	/**
	 * Whether to hide the "Your post" section
	 */
	hidePostPreview?: boolean;

	/**
	 * Whether to hide the "Link preview" section
	 */
	hideLinkPreview?: boolean;
}

/**
 * A focal point on an image. Both axes are 0-1, where `{ x: 0, y: 0 }` is the
 * top-left corner and `{ x: 1, y: 1 }` is the bottom-right.
 */
export type FocalPoint = {
	x: number;
	y: number;
};

export type MediaItem = {
	/**
	 * The alt text for the image.
	 */
	alt?: string;

	/**
	 * The mime type of the media
	 */
	type: string;

	/**
	 * The URL of the media.
	 */
	url: string;
};
