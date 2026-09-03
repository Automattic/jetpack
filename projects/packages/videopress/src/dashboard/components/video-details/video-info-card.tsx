import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { useCopyToClipboard } from '@wordpress/compose';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { copy } from '@wordpress/icons';
import { Card, Field, IconButton, InputControl, Stack, Text } from '@wordpress/ui';
import { resolveShareLink } from '../../utils/video-links';
import type { LibraryItem } from '../../types/library';
import type { ReactElement } from 'react';

type Props = {
	video: LibraryItem;
};

const dateSettings = getDateSettings();

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
			// Named after what it copies: the card renders two of these, and
			// "Copy" twice gives a screen-reader user no way to tell the link
			// button from the shortcode one. Same shape Home's cards use.
			label={ sprintf(
				/* translators: %s: name of the field being copied, e.g. "Link to video". */
				__( 'Copy %s', 'jetpack-videopress-pkg' ),
				fieldLabel
			) }
			icon={ copy }
			variant="minimal"
		/>
	);
};

/**
 * The panel beside the player: what this video is addressed by, and where it
 * came from. Link to video and Shortcode each carry a copy button; the file
 * name and upload date are read-outs.
 *
 * These four are grouped because they identify the video rather than describe
 * it — the same split YouTube Studio draws, where the preview column holds
 * the link, the file name and the upload state while every editable field
 * sits in the main column. The file name in particular reads as a fact about
 * the upload, not as something adjacent to the title a person chooses.
 *
 * Read-outs only, deliberately. Two things have left this card: "Add to a
 * post or page", which is an action and moved to the page header next to
 * Save, and Subtitles, which is a feature and got a card of its own on the
 * canvas — see subtitles-card.tsx.
 *
 * @param props       - Component props.
 * @param props.video - The current video record.
 * @return The card element.
 */
export default function VideoInfoCard( { video }: Props ): ReactElement {
	// Shared with Home's cards, and honest: null rather than a link built from
	// the attachment id, which produced a videopress.com URL that 404s behind
	// a Copy button that cheerfully copied it.
	const link = resolveShareLink( video );

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title render={ <h2 /> }>{ __( 'Video info', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					{ link && (
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
					) }

					{ video.shortcode && (
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
					) }

					{ /*
					 * Read-outs, not controls, so `nativeLabel={ false }` and a
					 * <span>: there is no form element for a <label> to point
					 * at. Field.Label carries the same 11px uppercase treatment
					 * as the labels on the InputControls above, which is why
					 * this stopped needing a hand-rolled `__meta-label` class.
					 *
					 * The file name is derived from the source URL rather than
					 * stored (use-library.ts), which is the other reason it
					 * belongs here and not next to the fields a person owns.
					 */ }
					<Field.Root>
						<Field.Label nativeLabel={ false } render={ <span /> }>
							{ __( 'File name', 'jetpack-videopress-pkg' ) }
						</Field.Label>
						<Text className="vp-video-details__readout">{ video.filename }</Text>
					</Field.Root>

					<Field.Root>
						<Field.Label nativeLabel={ false } render={ <span /> }>
							{ __( 'Uploaded on', 'jetpack-videopress-pkg' ) }
						</Field.Label>
						<Text>{ dateI18n( dateSettings.formats.date, video.uploadDate ) }</Text>
					</Field.Root>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
