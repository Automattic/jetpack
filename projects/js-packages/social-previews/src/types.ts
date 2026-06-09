import type { AnchorLink } from './helpers';
import type { SectionHeadingProps } from './shared/section-heading';

export interface SocialPreviewBaseProps {
	/**
	 * The URL of the post/page to preview.
	 */
	url: string;

	/**
	 * Editor hyperlinks from the post content, used to render `<a>` links over
	 * the matching body text on the networks that support inline links (Bluesky,
	 * Tumblr). Other networks ignore this.
	 */
	anchorLinks?: AnchorLink[];

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
