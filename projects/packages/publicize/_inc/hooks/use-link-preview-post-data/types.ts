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
	siteTitle: string | undefined;

	/**
	 * The description of the resource to preview.
	 */
	description: string | undefined;

	/**
	 * The URL of the image to use in the resource preview.
	 */
	image: string | undefined;

	/**
	 * The focal point of the preview image, when it resolves to an attachment
	 * with a stored point (the featured image). Undefined → centered.
	 */
	imageFocalPoint?: FocalPoint;
};
