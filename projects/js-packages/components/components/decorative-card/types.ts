export type DecorativeCardProps = {
	/**
	 * The format of the card (horizontal or vertical)
	 */
	format?: 'horizontal' | 'vertical';

	/**
	 * An icon slug that can be used to show an icon (options are limited to what is in the stylesheet)
	 */
	icon?: 'unlink';

	/**
	 * URL for an image to show in the card.
	 */
	imageUrl?: string;
};
