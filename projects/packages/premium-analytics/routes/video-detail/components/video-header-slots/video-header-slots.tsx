/**
 * External dependencies
 */
import { Icon, Skeleton, VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { video } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { formatPublishedDate, performanceSentence, type HeaderSlots } from '../../../detail-header';
import placeholders from '../../../detail-header.module.scss';
import type { VideoSummary } from '../../hooks';
import type { DateRange } from '@jetpack-premium-analytics/datetime';

type VideoHeaderSlotsArgs = {
	summary: VideoSummary;
	/** The committed report date range, stated as the performance window. */
	performanceRange?: DateRange;
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
 * one line stating the upload date and the applied performance window. Every
 * summary state names the page, so the header keeps its `h1` and its box while
 * the video resolves or fails.
 *
 * @param args                  - The slot inputs.
 * @param args.summary          - The video summary, in any state.
 * @param args.performanceRange - The committed report date range.
 * @return The `SectionHeader` slots for this video.
 */
export function videoHeaderSlots( {
	summary,
	performanceRange,
}: VideoHeaderSlotsArgs ): HeaderSlots {
	const glyph = <Icon icon={ video } size={ 28 } />;

	// The title lands on its own request, so the header would otherwise read as
	// blank until well after the grid has drawn (WOOA7S-2059).
	if ( summary.isLoading ) {
		return {
			visual: glyph,
			busy: true,
			title: (
				<>
					<VisuallyHidden>{ __( 'Loading…', 'jetpack-premium-analytics-pkg' ) }</VisuallyHidden>
					<Skeleton className={ placeholders.titlePlaceholder } />
				</>
			),
			subTitle: <Skeleton className={ placeholders.subTitlePlaceholder } />,
		};
	}

	// A failed or missing video has no trustworthy title, and no window worth
	// stating; the notice below the header carries the reason and the way out.
	if ( summary.isError || summary.isNotFound ) {
		return {
			visual: glyph,
			title: summary.isNotFound
				? __( 'Video not found', 'jetpack-premium-analytics-pkg' )
				: __( 'Video unavailable', 'jetpack-premium-analytics-pkg' ),
		};
	}

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
		title: summary.title?.trim() || __( 'Untitled video', 'jetpack-premium-analytics-pkg' ),
		subTitle: subtitle || undefined,
	};
}
