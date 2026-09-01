export type LocalState = {
	/**
	 * ID of the image in the generated image.
	 */
	imageId: number | null;

	/**
	 * Type of the image in the generated image.
	 */
	imageType: 'default' | 'featured' | 'custom' | 'none';

	/**
	 * Custom text for the generated image.
	 */
	customText: string;

	/**
	 * Template for the generated image.
	 */
	template: string | null;

	/**
	 * Font for the generated image.
	 */
	font: string;
};
