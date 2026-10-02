import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, Card, Skeleton, Stack, Text } from '@wordpress/ui';
import { useVideoTracks } from '../../../client/components/caption-manager-modal/use-video-tracks';
import {
	getLanguageDisplayName,
	getManualLanguageTagFromTrackKey,
} from '../../../client/lib/video-tracks/language';
import type { LibraryItem } from '../../types/library';
import type { ReactElement } from 'react';

type Props = {
	video: LibraryItem;
	onManageSubtitles: () => void;
};

// The summary lists this many languages before collapsing into "and N more".
const MAX_SUBTITLE_LANGUAGES_SHOWN = 2;

/**
 * The card proper. Split from the guard below so the tracks query only exists
 * for videos that actually have a GUID to query with.
 *
 * @param props                   - Component props.
 * @param props.video             - The current video record.
 * @param props.onManageSubtitles - Opens the caption manager.
 * @return The card element.
 */
function SubtitlesCardContent( { video, onManageSubtitles }: Props ): ReactElement {
	/*
	 * The media REST item omits `tracks`, so the languages come from the same
	 * video-info query the caption manager uses.
	 */
	const { managedTracks, isLoading } = useVideoTracks( {
		guid: video.guid,
		isOpen: true,
		isPrivate: video.isPrivate,
		tracks: video.tracks,
	} );

	const subtitleLanguages = [
		...new Set(
			managedTracks
				.filter( track => track.kind === 'captions' || track.kind === 'subtitles' )
				.map(
					track =>
						track.label ||
						getLanguageDisplayName(
							getManualLanguageTagFromTrackKey( track.srcLang ) || track.srcLang
						)
				)
		),
	];
	const shownLanguages = subtitleLanguages.slice( 0, MAX_SUBTITLE_LANGUAGES_SHOWN ).join( ', ' );
	const moreLanguagesCount = subtitleLanguages.length - MAX_SUBTITLE_LANGUAGES_SHOWN;
	let subtitleSummary = shownLanguages || __( 'No subtitles yet.', 'jetpack-videopress-pkg' );
	if ( moreLanguagesCount > 0 ) {
		subtitleSummary = sprintf(
			/* translators: 1: list of subtitle language names. 2: how many further languages exist. */
			_n(
				'%1$s, and %2$d more',
				'%1$s, and %2$d more',
				moreLanguagesCount,
				'jetpack-videopress-pkg'
			),
			shownLanguages,
			moreLanguagesCount
		);
	}

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Subtitles', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				{ /*
				 * State first, then the action — the same rhythm as the
				 * Thumbnail card above this one. The two used to share a row,
				 * which read as fragments ("None [Manage subtitles]").
				 */ }
				<Stack direction="column" gap="md" align="start">
					{ isLoading ? (
						<Skeleton className="vp-subtitles__loading" />
					) : (
						<Text className="vp-subtitles__summary">{ subtitleSummary }</Text>
					) }
					{ /*
					 * The full string, not "Manage". The label used to read
					 * "Manage" with "Manage subtitles" hidden in an aria-label,
					 * which left the visible text meaningless the moment it was
					 * separated from its row label.
					 */ }
					<Button variant="outline" onClick={ onManageSubtitles }>
						{ __( 'Manage subtitles', 'jetpack-videopress-pkg' ) }
					</Button>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}

/**
 * Which subtitle languages this video has, and the way in to add or change
 * them.
 *
 * It gets a card on the canvas rather than a row in the reference panel
 * because the two ways in before this were both nearly invisible: a
 * lowest-emphasis button labelled "Manage" at the foot of the second panel
 * card — below the fold on a laptop, and absent entirely without a GUID — and
 * an iconless first item inside an unlabelled ⋮ menu. Captions are an
 * accessibility feature; hiding them behind a kebab was the wrong call.
 *
 * The ⋮ menu keeps its entry. This is an addition, not a move: a menu people
 * already know is not worth breaking.
 *
 * Renders nothing without a GUID — the tracks API is keyed by it, so there is
 * nothing to read and nothing to manage until the upload completes.
 *
 * @param props                   - Component props.
 * @param props.video             - The current video record.
 * @param props.onManageSubtitles - Opens the caption manager.
 * @return The card, or null when the video has no GUID yet.
 */
export default function SubtitlesCard( { video, onManageSubtitles }: Props ): ReactElement | null {
	if ( ! video.guid ) {
		return null;
	}

	return <SubtitlesCardContent video={ video } onManageSubtitles={ onManageSubtitles } />;
}
