export type LocalState = {
	/**
	 * ID of the image in the generated image.
	 */
	imageId: number | undefined;

	/**
	 * Type of the image in the generated image.
	 */
	imageType: 'default' | 'featured' | 'custom' | 'none';

	/**
	 * Custom text for the generated image.
	 */
	customText: string | undefined;

	/**
	 * Template for the generated image.
	 */
	template: string | undefined;

	/**
	 * Font for the image text.
	 */
	font: string | undefined;
};
