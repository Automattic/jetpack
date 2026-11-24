/**
 * External dependencies
 */
import { getSettings, gmdateI18n } from '@wordpress/date';
import { RawHTML } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Dialog, Link, Stack, Text } from '@wordpress/ui';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { emitSurfaceEvent } from '../../utils';
import styles from './reader.module.css';
import type { Announcement, AnnouncementMedia } from '../../types';

export type ReaderProps = {
	/*
	 * The announcement to show.
	 */
	announcement: Announcement;

	/*
	 * Whether the dialog is open. The announcement stays rendered while it closes.
	 */
	isOpen: boolean;

	/*
	 * Called when the reader closes the dialog.
	 */
	onClose: () => void;
};

type MediaProps = {
	/*
	 * The media of the announcement.
	 */
	media: AnnouncementMedia;
};

/**
 * The image or the video of an announcement. A video plays muted, so it needs no captions.
 *
 * @param {MediaProps} props - The props.
 * @return The media element.
 */
function Media( { media }: MediaProps ) {
	if ( media.type === 'video' ) {
		return (
			<video
				className={ styles.media }
				src={ media.url }
				aria-label={ media.alt || undefined }
				controls
				muted
				playsInline
			/>
		);
	}

	return <img className={ styles.media } src={ media.url } alt={ media.alt } />;
}

/**
 * The modal dialog that shows one announcement, titled by it.
 *
 * @param {ReaderProps} props - The props.
 * @return The reader.
 */
export function Reader( { announcement, isOpen, onClose }: ReaderProps ) {
	const { id, title, date, media, content, link } = announcement;

	const handleOpenChange = useCallback(
		( open: boolean ) => {
			if ( ! open ) {
				onClose();
			}
		},
		[ onClose ]
	);

	const handleLinkClick = useCallback( () => {
		emitSurfaceEvent( { type: 'readerLinkClick', announcementId: id } );
	}, [ id ] );

	return (
		<Dialog.Root open={ isOpen } onOpenChange={ handleOpenChange }>
			<Dialog.Popup>
				<Dialog.Header>
					<Dialog.Title>{ title }</Dialog.Title>
					<Dialog.CloseIconButton />
				</Dialog.Header>
				<Dialog.Content>
					<Stack direction="column" gap="lg">
						<Text variant="body-sm" className={ styles.date } render={ <time dateTime={ date } /> }>
							{ gmdateI18n( getSettings().formats.date, date ) }
						</Text>
						{ media && <Media media={ media } /> }
						{ content && <RawHTML className={ styles.body }>{ content }</RawHTML> }
						{ link && (
							<Link href={ link } openInNewTab onClick={ handleLinkClick }>
								{ __( 'Read the full article', 'jetpack-announcements' ) }
							</Link>
						) }
					</Stack>
				</Dialog.Content>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
