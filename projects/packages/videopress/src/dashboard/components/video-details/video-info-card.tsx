import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { useCopyToClipboard } from '@wordpress/compose';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { __, _n, sprintf } from '@wordpress/i18n';
import { copy } from '@wordpress/icons';
import { Button, Card, Field, IconButton, InputControl, Stack, Text } from '@wordpress/ui';
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

const dateSettings = getDateSettings();

// The Subtitles row lists this many languages before collapsing into "and N more".
const MAX_SUBTITLE_LANGUAGES_SHOWN = 2;

const linkForVideo = ( video: LibraryItem ): string => {
	const host = video.isPrivate ? 'video.wordpress.com' : 'videopress.com';
	return `https://${ host }/v/${ video.guid || video.id }`;
};

/**
 * Icon-only button that copies its `text` prop to the clipboard. Uses
 * `@wordpress/compose`'s `useCopyToClipboard` (clipboard.js under the hood)
 * so it falls back to `document.execCommand('copy')` on non-secure origins —
 * the native `navigator.clipboard` API is undefined on plain HTTP, which
 * the dev environments here run on. Posts a success snackbar via the
 * dashboard's GlobalNotices store on every successful copy.
 *
 * @param props            - Component props.
 * @param props.text       - The string to write to the clipboard on click.
 * @param props.fieldLabel - Human-readable name of the field being copied,
 *                         used in the success snackbar.
 * @return The icon-button element.
 */
const CopyIconButton = ( {
	text,
	fieldLabel,
}: {
	text: string;
	fieldLabel: string;
} ): ReactElement => {
	const { createSuccessNotice } = useGlobalNotices();
	const ref = useCopyToClipboard( text, () =>
		createSuccessNotice(
			sprintf(
				/* translators: %s: name of the copied field, e.g. "Link to video". */
				__( '%s copied to clipboard.', 'jetpack-videopress-pkg' ),
				fieldLabel
			)
		)
	);
	return (
		<IconButton
			ref={ ref }
			label={ __( 'Copy', 'jetpack-videopress-pkg' ) }
			icon={ copy }
			variant="minimal"
		/>
	);
};

/**
 * Inspector card for the facts about a video that nobody edits here: where it
 * can be linked or embedded (Link to video and Shortcode, each with a copy
 * button), when it was uploaded, and which subtitle languages exist.
 *
 * Read-outs only. "Add to a post or page" used to live at the bottom of this
 * card, which made an action the last row of a reference panel; it moved to
 * the page header, next to Save, because it is the one control here that
 * leaves the screen. Everything a person writes lives in VideoDetailsCard.
 *
 * @param props                   - Component props.
 * @param props.video             - The current video record.
 * @param props.onManageSubtitles - Opens the caption manager.
 * @return The card element.
 */
export default function VideoInfoCard( { video, onManageSubtitles }: Props ): ReactElement {
	const link = linkForVideo( video );

	/*
	 * The media REST item omits `tracks`, so the languages come from the same
	 * video-info query the caption manager uses.
	 */
	const { managedTracks, isLoading: isLoadingTracks } = useVideoTracks( {
		guid: video.guid ?? '',
		isOpen: !! video.guid,
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
	let subtitleSummary = shownLanguages || __( 'None', 'jetpack-videopress-pkg' );
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
				<Card.Title>{ __( 'Video info', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					<InputControl
						label={ __( 'Link to video', 'jetpack-videopress-pkg' ) }
						value={ link }
						readOnly
						suffix={
							<CopyIconButton
								text={ link }
								fieldLabel={ __( 'Link to video', 'jetpack-videopress-pkg' ) }
							/>
						}
					/>

					<InputControl
						label={ __( 'Shortcode', 'jetpack-videopress-pkg' ) }
						value={ video.shortcode }
						readOnly
						suffix={
							<CopyIconButton
								text={ video.shortcode }
								fieldLabel={ __( 'Shortcode', 'jetpack-videopress-pkg' ) }
							/>
						}
					/>

					{ /*
					 * Read-outs, not controls, so `nativeLabel={ false }` and a
					 * <span>: there is no form element for a <label> to point
					 * at. Field.Label carries the same 11px uppercase treatment
					 * as the labels on the InputControls above, which is why
					 * this stopped needing a hand-rolled `__meta-label` class.
					 */ }
					<Field.Root>
						<Field.Label nativeLabel={ false } render={ <span /> }>
							{ __( 'Uploaded on', 'jetpack-videopress-pkg' ) }
						</Field.Label>
						<Text>{ dateI18n( dateSettings.formats.date, video.uploadDate ) }</Text>
					</Field.Root>

					{ video.guid && (
						<Field.Root>
							<Field.Label nativeLabel={ false } render={ <span /> }>
								{ __( 'Subtitles', 'jetpack-videopress-pkg' ) }
							</Field.Label>
							<Stack direction="row" gap="sm" align="center">
								<Text className="vp-video-details__readout">
									{ isLoadingTracks ? __( 'Loading…', 'jetpack-videopress-pkg' ) : subtitleSummary }
								</Text>
								<Button
									variant="minimal"
									size="small"
									className="vp-video-details__manage-subtitles"
									aria-label={ __( 'Manage subtitles', 'jetpack-videopress-pkg' ) }
									onClick={ onManageSubtitles }
								>
									{ __( 'Manage', 'jetpack-videopress-pkg' ) }
								</Button>
							</Stack>
						</Field.Root>
					) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
