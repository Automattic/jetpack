/**
 * External dependencies
 */
import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './leaderboard-label.module.scss';

export type LeaderboardLabelProps = {
	/**
	 * Label text
	 */
	label: string;
	/**
	 * Image URL
	 */
	imageUrl?: string;
	/**
	 * Alt text for the image
	 */
	imageAlt?: string;
	/**
	 * Class name for the image
	 */
	imageClassName?: string;
	/**
	 * How to render a missing image
	 */
	imageFallback?: 'placeholder' | 'hidden';
};

// Simple default image for when the image is not available.
const DEFAULT_IMAGE_URL =
	'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect width="50" height="50" fill="%23e5e7eb"/></svg>';

/**
 * Leaderboard Label Component
 *
 * Renders a label with an optional image thumbnail for use in leaderboard charts.
 * Displays image (if available) alongside the label.
 *
 * Features:
 * - Image thumbnail with fallback
 * - Error handling for failed image loads
 * - Responsive layout with consistent spacing
 *
 * @param props                - Component props
 * @param props.label          - Label text
 * @param props.imageUrl       - Optional image URL
 * @param props.imageAlt       - Alt text for the image
 * @param props.imageClassName - Class name for the image
 * @param props.imageFallback  - How to render a missing image
 */
export function LeaderboardLabel( {
	label,
	imageUrl,
	imageAlt,
	imageClassName,
	imageFallback = 'placeholder',
}: LeaderboardLabelProps ) {
	// Use default if undefined OR empty string to prevent broken image flash
	const finalImageUrl = imageUrl || DEFAULT_IMAGE_URL;
	const shouldRenderImage = imageFallback === 'placeholder' || Boolean( imageUrl );

	return (
		<Stack direction="row" gap="sm" align="center" className={ styles.container }>
			{ shouldRenderImage && (
				<img
					src={ finalImageUrl }
					onError={ ( e: React.SyntheticEvent< HTMLImageElement > ) => {
						e.currentTarget.src = DEFAULT_IMAGE_URL;
					} }
					alt={ imageAlt ?? label }
					className={ clsx( styles.labelImage, imageClassName ) }
				/>
			) }
			<span className={ styles.label }>{ label }</span>
		</Stack>
	);
}
