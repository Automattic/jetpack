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
