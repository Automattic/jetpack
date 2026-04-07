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
};
