/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './leaderboard-label.module.scss';

export type LeaderboardRowMedia =
	| { kind: 'avatar'; url?: string; name: string }
	| { kind: 'favicon'; url?: string }
	| { kind: 'flag'; url?: string; country: string }
	| { kind: 'thumbnail'; url?: string; alt: string }
	| { kind: 'none' };

export type LeaderboardLabelProps = {
	/** Label text. */
	label: string;
	/** Optional media rendered before the label. */
	media: LeaderboardRowMedia;
	/** Whether assistive technology should ignore the image. */
	decorativeMedia?: boolean;
};

// Simple default image for media kinds that reserve space when no image is available.
const DEFAULT_IMAGE_URL =
	'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect width="50" height="50" fill="%23e5e7eb"/></svg>';

function getMediaDetails( media: Exclude< LeaderboardRowMedia, { kind: 'none' } > ) {
	switch ( media.kind ) {
		case 'avatar':
			return {
				alt: sprintf(
					/* translators: %s is a person's name. */
					__( 'Avatar of %s', 'jetpack-premium-analytics-pkg' ),
					media.name
				),
				className: styles.avatar,
				fallback: 'placeholder' as const,
				url: media.url,
			};
		case 'favicon':
			return {
				alt: '',
				className: styles.favicon,
				fallback: 'hidden' as const,
				url: media.url,
			};
		case 'flag':
			return {
				alt: sprintf(
					/* translators: %s is a country name. */
					__( 'Flag of %s', 'jetpack-premium-analytics-pkg' ),
					media.country
				),
				className: styles.flag,
				fallback: 'placeholder' as const,
				url: media.url,
			};
		case 'thumbnail':
			return {
				alt: media.alt,
				className: styles.thumbnail,
				fallback: 'placeholder' as const,
				url: media.url,
			};
	}
}

/**
 * Render media and truncating text outside a leaderboard chart row.
 *
 * @param props                 - Component props.
 * @param props.label           - Label text.
 * @param props.media           - Optional media rendered before the label.
 * @param props.decorativeMedia - Whether assistive technology should ignore the image.
 * @return The rendered label.
 */
export function LeaderboardLabel( {
	label,
	media,
	decorativeMedia = false,
}: LeaderboardLabelProps ) {
	const [ failedImageUrl, setFailedImageUrl ] = useState< string >();
	const mediaDetails = media.kind === 'none' ? null : getMediaDetails( media );
	const shouldRenderImage =
		mediaDetails &&
		( mediaDetails.fallback === 'placeholder' || Boolean( mediaDetails.url ) ) &&
		( mediaDetails.fallback !== 'hidden' || mediaDetails.url !== failedImageUrl );

	return (
		<Stack
			direction="row"
			gap="sm"
			align="center"
			className={ clsx( styles.container, mediaDetails?.className ) }
		>
			{ shouldRenderImage && (
				<img
					src={ mediaDetails.url || DEFAULT_IMAGE_URL }
					onError={ event => {
						if ( mediaDetails.fallback === 'hidden' ) {
							setFailedImageUrl( mediaDetails.url );
							return;
						}

						event.currentTarget.src = DEFAULT_IMAGE_URL;
					} }
					alt={ decorativeMedia ? '' : mediaDetails.alt }
					className={ styles.media }
				/>
			) }
			<span className={ styles.label }>{ label }</span>
		</Stack>
	);
}
