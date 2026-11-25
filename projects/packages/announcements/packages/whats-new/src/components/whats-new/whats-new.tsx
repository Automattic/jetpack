/**
 * External dependencies
 */
import { useEnableWpCompatOverlaySlot } from '@wordpress/ui';
import { useCallback, useEffect, useState } from 'react';
/**
 * Internal dependencies
 */
import { useAnnouncements } from '../../hooks';
import { emitSurfaceEvent } from '../../utils';
import { Reader } from '../reader';
import { Teaser } from '../teaser';
import styles from './whats-new.module.css';

export type WhatsNewProps = {
	/*
	 * The channels the host subscribes to.
	 */
	channels: string[];
};

/**
 * The What's new surface: the teaser of the newest unseen announcement and its reader.
 *
 * @param {WhatsNewProps} props - The props.
 * @return The surface.
 */
export function WhatsNew( { channels }: WhatsNewProps ) {
	// The surface is a root of its own, so it opts in for its dialog to stack above wp-admin.
	useEnableWpCompatOverlaySlot();

	const { announcements, teaser, markSeen } = useAnnouncements( channels );

	// The id stays after the dialog closes, so the announcement is rendered while it animates out.
	const [ readerId, setReaderId ] = useState< string | null >( null );
	const [ isReaderOpen, setIsReaderOpen ] = useState( false );
	const inReader = announcements.find( ( { id } ) => id === readerId );

	const teaserId = teaser?.id;

	useEffect( () => {
		if ( teaserId ) {
			emitSurfaceEvent( { type: 'teaserView', announcementId: teaserId } );
		}
	}, [ teaserId ] );

	const openTeaser = useCallback( () => {
		if ( ! teaserId ) {
			return;
		}
		setReaderId( teaserId );
		setIsReaderOpen( true );
		markSeen( teaserId );
		emitSurfaceEvent( { type: 'teaserOpen', announcementId: teaserId } );
	}, [ teaserId, markSeen ] );

	const dismissTeaser = useCallback( () => {
		if ( teaserId ) {
			markSeen( teaserId );
			emitSurfaceEvent( { type: 'teaserDismiss', announcementId: teaserId } );
		}
	}, [ teaserId, markSeen ] );

	const closeReader = useCallback( () => setIsReaderOpen( false ), [] );

	return (
		<>
			{ teaser && (
				<div className={ styles.placement }>
					<Teaser announcement={ teaser } onOpen={ openTeaser } onDismiss={ dismissTeaser } />
				</div>
			) }
			{ inReader && (
				<Reader announcement={ inReader } isOpen={ isReaderOpen } onClose={ closeReader } />
			) }
		</>
	);
}
