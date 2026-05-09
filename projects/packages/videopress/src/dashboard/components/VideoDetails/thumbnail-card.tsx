import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { useCopyToClipboard } from '@wordpress/compose';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { copy } from '@wordpress/icons';
import { Button, Card, IconButton, InputControl, Stack, Text } from '@wordpress/ui';
import type { MockLibraryItem } from '../../types/library';
import type { ReactElement } from 'react';

type Props = {
	video: MockLibraryItem;
	onAddToNewPost: () => void;
};

const dateSettings = getDateSettings();

const linkForVideo = ( video: MockLibraryItem ): string => `https://videopress.com/v/${ video.id }`;

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
 * Top-of-page card on the Video details screen. Renders the thumbnail,
 * the "Add video to new post" outlined action, two read-only copy fields
 * (Link to video, Shortcode) using InputControl + IconButton suffix, and
 * two metadata rows (File name, Uploaded on).
 *
 * @param props                - Component props.
 * @param props.video          - The current video record.
 * @param props.onAddToNewPost - Click handler for the secondary action.
 * @return The card element.
 */
export default function ThumbnailCard( { video, onAddToNewPost }: Props ): ReactElement {
	const link = linkForVideo( video );

	return (
		<Card.Root>
			<Card.Content>
				<Stack direction="row" gap="md" align="start" className="vp-video-details__thumbnail-row">
					{ video.thumbnailUrl && (
						<img
							src={ video.thumbnailUrl }
							alt=""
							width={ 240 }
							height={ 135 }
							className="vp-video-details__thumbnail"
						/>
					) }
					<Stack direction="column" gap="md" className="vp-video-details__thumbnail-meta">
						<Button
							variant="outline"
							onClick={ onAddToNewPost }
							className="vp-video-details__primary-action"
						>
							{ __( 'Add video to new post', 'jetpack-videopress-pkg' ) }
						</Button>

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

						<Stack direction="column" gap="xs">
							<Text variant="body-sm" className="vp-video-details__meta-label">
								{ __( 'File name', 'jetpack-videopress-pkg' ) }
							</Text>
							<Text>{ video.filename }</Text>
						</Stack>

						<Stack direction="column" gap="xs">
							<Text variant="body-sm" className="vp-video-details__meta-label">
								{ __( 'Uploaded on', 'jetpack-videopress-pkg' ) }
							</Text>
							<Text>{ dateI18n( dateSettings.formats.date, video.uploadDate ) }</Text>
						</Stack>
					</Stack>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
