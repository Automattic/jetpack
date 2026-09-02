/**
 * External dependencies
 */
import { Icon } from '@jetpack-premium-analytics/externals';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { video } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { formatPublishedDate, performanceSentence } from '../../../detail-header-text';
import type { VideoSummary } from '../../hooks';
import type { ReactNode } from 'react';

type VideoHeaderSlotsArgs = {
	summary: VideoSummary;
	/** The committed report date range, stated as the performance window. */
	performanceRange?: { from: Date | undefined; to: Date | undefined };
};

type HeaderSlots = {
	visual: ReactNode;
	title: ReactNode;
	subTitle: ReactNode;
};

/**
 * The video's poster. Poster URLs can be tokenless and 404 for private videos,
 * so a failed load swaps in the placeholder.
 *
 * @param props           - Component props.
 * @param props.posterUrl - The poster URL, when the video carries one.
 * @return The poster image or its placeholder glyph.
 */
function VideoPoster( { posterUrl }: { posterUrl?: string } ) {
	const [ failedPosterUrl, setFailedPosterUrl ] = useState< string >();
	const hidePoster = useCallback( () => setFailedPosterUrl( posterUrl ), [ posterUrl ] );

	return posterUrl && posterUrl !== failedPosterUrl ? (
		<img src={ posterUrl } alt="" onError={ hidePoster } />
	) : (
		<Icon icon={ video } size={ 28 } />
	);
}

/**
 * The video identity for the page header: poster (or placeholder), title, and
 * one line stating the upload date and the applied performance window.
 *
 * @param args                  - The slot inputs.
 * @param args.summary          - The resolved video summary.
 * @param args.performanceRange - The committed report date range.
 * @return The `SectionHeader` slots for this video.
 */
export function videoHeaderSlots( {
	summary,
	performanceRange,
}: VideoHeaderSlotsArgs ): HeaderSlots {
	const formattedDate = formatPublishedDate( summary.publishedDate );

	const publishedSentence = formattedDate
		? sprintf(
				/* translators: %s: the video upload date, e.g. "Aug 19, 2025". */
				__( 'Video uploaded on %s.', 'jetpack-premium-analytics-pkg' ),
				formattedDate
		  )
		: undefined;

	const subtitle = [ publishedSentence, performanceSentence( performanceRange ) ]
		.filter( Boolean )
		.join( ' ' );

	return {
		visual: <VideoPoster posterUrl={ summary.posterUrl } />,
		title: summary.title,
		subTitle: subtitle || undefined,
	};
}
