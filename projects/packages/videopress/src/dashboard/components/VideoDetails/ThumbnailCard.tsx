import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
 * Icon-only button that copies its `text` prop to the clipboard. Renders the
 * Gutenberg `copy` icon and surfaces a transient "Copied" tooltip via its
 * accessible label, with no inline state in the parent.
 *
 * @param props      - Component props.
 * @param props.text - The string to write to the clipboard on click.
 * @return The icon-button element.
 */
const CopyIconButton = ( { text }: { text: string } ): ReactElement => {
	const [ copied, setCopied ] = useState( false );
	const onClick = async () => {
		await navigator.clipboard.writeText( text );
		setCopied( true );
		window.setTimeout( () => setCopied( false ), 2000 );
	};
	return (
		<IconButton
			label={
				copied ? __( 'Copied', 'jetpack-videopress-pkg' ) : __( 'Copy', 'jetpack-videopress-pkg' )
			}
			icon={ copy }
			variant="minimal"
			onClick={ onClick }
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
				<Stack direction="row" gap="md" align="start">
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
							suffix={ <CopyIconButton text={ link } /> }
						/>

						<InputControl
							label={ __( 'Shortcode', 'jetpack-videopress-pkg' ) }
							value={ video.shortcode }
							readOnly
							suffix={ <CopyIconButton text={ video.shortcode } /> }
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
