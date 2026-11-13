/**
 * External dependencies
 */
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { dispatch, select, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import { getAnnouncementsForChannels, selectTeaser } from './select-announcements';
import type { Announcement } from '../../types';

const ENTITY_KIND = 'jetpack';
const ENTITY_NAME = 'announcement';

// Without `per_page: -1` core-data pages the list on the client.
const ALL_ANNOUNCEMENTS = { per_page: -1 };

export type UseAnnouncementsResult = {
	/*
	 * The announcements of the given channels, newest first. Empty until the request resolves.
	 */
	announcements: Announcement[];

	/*
	 * The announcement to tease, or null.
	 */
	teaser: Announcement | null;

	/*
	 * Marks an announcement as seen by the current user. It stops being teased at once.
	 */
	markSeen: ( id: string ) => void;
};

/**
 * Registers the announcement entity, unless it is registered already.
 *
 * Call it once the translations are loaded: the label is built with `__()`.
 */
export function ensureAnnouncementEntity(): void {
	if ( select( coreStore ).getEntityConfig( ENTITY_KIND, ENTITY_NAME ) ) {
		return;
	}

	dispatch( coreStore ).addEntities( [
		{
			kind: ENTITY_KIND,
			name: ENTITY_NAME,
			key: 'id',
			baseURL: '/wpcom/v2/jetpack-announcements',
			plural: 'announcements',
			label: __( 'Announcements', 'jetpack-announcements' ),
			supportsPagination: false,
		},
	] );
}

/**
 * Reads the announcements of the given channels and writes their seen state.
 *
 * The only module that knows the data layer: components receive values and callbacks.
 *
 * @param channels - The channels the host subscribes to.
 * @return The announcements, the one to tease and the callback that marks one as seen.
 */
export function useAnnouncements( channels: string[] ): UseAnnouncementsResult {
	const { records } = useEntityRecords< Announcement >(
		ENTITY_KIND,
		ENTITY_NAME,
		ALL_ANNOUNCEMENTS
	);
	const { saveEntityRecord } = useDispatch( coreStore );

	// Kept for the page load: a marked announcement stops being teased whatever its write answers.
	const [ markedIds, setMarkedIds ] = useState< ReadonlySet< string > >( () => new Set() );

	const announcements = useMemo(
		() => getAnnouncementsForChannels( records ?? [], channels ),
		[ records, channels ]
	);

	const markSeen = useCallback(
		( id: string ) => {
			setMarkedIds( ids => new Set( ids ).add( id ) );
			// A failed write leaves it unseen on the server, so it is teased again on the next load.
			void saveEntityRecord( ENTITY_KIND, ENTITY_NAME, { id, seen: true } );
		},
		[ saveEntityRecord ]
	);

	return { announcements, teaser: selectTeaser( announcements, markedIds ), markSeen };
}
