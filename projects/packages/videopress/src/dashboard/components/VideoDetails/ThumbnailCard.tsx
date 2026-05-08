import { ClipboardButton } from '@wordpress/components';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import type { MockLibraryItem } from '../../types/library';
import type { ReactElement } from 'react';

type Props = {
	video: MockLibraryItem;
	onAddToNewPost: () => void;
};

const dateSettings = getDateSettings();

const linkForVideo = ( video: MockLibraryItem ): string => `https://videopress.com/v/${ video.id }`;

/**
 * Top-of-page card on the Video details screen. Renders the thumbnail,
 * the primary "Add video to new post" action, two read-only copy fields
 * (Link to video, Shortcode), and two readonly metadata rows (Filename,
 * Uploaded on).
 *
 * @param props                - Component props.
 * @param props.video          - The current video record.
 * @param props.onAddToNewPost - Click handler for the primary action.
 * @return The card element.
 */
export default function ThumbnailCard( { video, onAddToNewPost }: Props ): ReactElement {
	const [ linkCopied, setLinkCopied ] = useState( false );
	const [ shortcodeCopied, setShortcodeCopied ] = useState( false );

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
						<Button variant="primary" onClick={ onAddToNewPost }>
							{ __( 'Add video to new post', 'jetpack-videopress-pkg' ) }
						</Button>

						<Stack direction="column" gap="xs">
							<Text variant="caption">{ __( 'Link to video', 'jetpack-videopress-pkg' ) }</Text>
							<Stack direction="row" gap="sm" align="center">
								<Text>{ link }</Text>
								<ClipboardButton
									text={ link }
									onCopy={ () => setLinkCopied( true ) }
									onFinishCopy={ () => setLinkCopied( false ) }
								>
									{ linkCopied
										? __( 'Copied', 'jetpack-videopress-pkg' )
										: __( 'Copy', 'jetpack-videopress-pkg' ) }
								</ClipboardButton>
							</Stack>
						</Stack>

						<Stack direction="column" gap="xs">
							<Text variant="caption">{ __( 'Shortcode', 'jetpack-videopress-pkg' ) }</Text>
							<Stack direction="row" gap="sm" align="center">
								<Text>
									<code>{ video.shortcode }</code>
								</Text>
								<ClipboardButton
									text={ video.shortcode }
									onCopy={ () => setShortcodeCopied( true ) }
									onFinishCopy={ () => setShortcodeCopied( false ) }
								>
									{ shortcodeCopied
										? __( 'Copied', 'jetpack-videopress-pkg' )
										: __( 'Copy', 'jetpack-videopress-pkg' ) }
								</ClipboardButton>
							</Stack>
						</Stack>

						<Stack direction="column" gap="xs">
							<Text variant="caption">{ __( 'File name', 'jetpack-videopress-pkg' ) }</Text>
							<Text>{ video.filename }</Text>
						</Stack>

						<Stack direction="column" gap="xs">
							<Text variant="caption">{ __( 'Uploaded on', 'jetpack-videopress-pkg' ) }</Text>
							<Text>{ dateI18n( dateSettings.formats.date, video.uploadDate ) }</Text>
						</Stack>
					</Stack>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
