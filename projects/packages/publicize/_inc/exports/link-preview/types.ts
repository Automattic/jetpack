import type { FocalPoint } from '../../utils/types';

export type LinkPreviewData = {
	/**
	 * The URL of the resource to preview.
	 */
	url: string;

	/**
	 * The title of the resource to preview.
	 */
	title: string;

	/**
	 * Site title to show in the Google Search preview.
	 */
	siteTitle?: string;

	/**
	 * The URL of the site icon to use in the Google Search preview.
	 */
	siteIcon?: string;

	/**
	 * The description of the resource to preview.
	 */
	description?: string;

	/**
	 * The URL of the image to use in the resource preview.
	 */
	image?: string;

	/**
	 * The focal point of the preview image, when it resolves to an attachment
	 * with a stored point. Undefined → centered.
	 */
	imageFocalPoint?: FocalPoint;
};

export type LinkPreviewPlatform =
	| 'bluesky'
	| 'facebook'
	| 'google'
	| 'linkedin'
	| 'mastodon'
	| 'nextdoor'
	| 'threads'
	| 'tumblr'
	| 'x';
