/**
 * External dependencies
 */
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { dispatch, select, useRegistry, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import { getAnnouncementsForChannels, selectTeaser } from './select-announcements';
import type { Announcement, SeenDates } from '../../types';

const ENTITY_KIND = 'jetpack';
const ENTITY_NAME = 'announcement';

// Without `per_page: -1` core-data pages the list on the client.
const ALL_ANNOUNCEMENTS = { per_page: -1 };

// One scope for every host: what is seen or turned off in one is so in all of them.
const PREFERENCES_SCOPE = 'jetpack-announcements/whats-new';
const SEEN_KEY = 'seen';
const TEASER_OFF_KEY = 'teaserOff';

const NOTHING_SEEN: SeenDates = {};

type PreferencesSelectors = {
	get: ( scope: string, key: string ) => unknown;
};

type PreferencesActions = {
	set: ( scope: string, key: string, value: SeenDates ) => void;
};

export type UseAnnouncementsResult = {
	/*
	 * The announcements of the given channels, newest first. Empty until the request resolves.
	 */
	announcements: Announcement[];

	/*
	 * The announcement to tease, or null. Always null while the user has the teaser off.
	 */
	teaser: Announcement | null;

	/*
	 * Marks an announcement as seen by the current user. It stops being teased at once.
	 */
	markSeen: ( id: string ) => void;
};

/**
 * Narrows a stored preference to the dates the user saw each announcement.
 *
 * @param value - The stored preference value.
 * @return The dates by id, or nothing seen for a value of another shape.
 */
function toSeenDates( value: unknown ): SeenDates {
	if ( ! value || typeof value !== 'object' || Array.isArray( value ) ) {
		return NOTHING_SEEN;
	}

	return value as SeenDates;
}

/**
 * Registers the announcement entity, unless it is registered already.
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
 * Reads the announcements of the given channels, and what the user has seen of them.
 *
 * The only module that knows the data layer: components receive values and callbacks.
 * What is seen and the switch that turns the teaser off live in the user's preferences, which
 * WordPress persists.
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
	const registry = useRegistry();

	const seen = useSelect(
		storeSelect =>
			toSeenDates(
				( storeSelect( preferencesStore ) as PreferencesSelectors ).get(
					PREFERENCES_SCOPE,
					SEEN_KEY
				)
			),
		[]
	);

	const isTeaserOff = useSelect(
		storeSelect =>
			( storeSelect( preferencesStore ) as PreferencesSelectors ).get(
				PREFERENCES_SCOPE,
				TEASER_OFF_KEY
			) === true,
		[]
	);

	const announcements = useMemo(
		() => getAnnouncementsForChannels( records ?? [], channels ),
		[ records, channels ]
	);

	const markSeen = useCallback(
		( id: string ) => {
			const preferences = registry.select( preferencesStore ) as PreferencesSelectors;
			const current = toSeenDates( preferences.get( PREFERENCES_SCOPE, SEEN_KEY ) );

			// One already seen keeps its date.
			if ( current[ id ] !== undefined ) {
				return;
			}

			( registry.dispatch( preferencesStore ) as PreferencesActions ).set(
				PREFERENCES_SCOPE,
				SEEN_KEY,
				{ ...current, [ id ]: new Date().toISOString() }
			);
		},
		[ registry ]
	);

	return {
		announcements,
		teaser: isTeaserOff ? null : selectTeaser( announcements, seen ),
		markSeen,
	};
}
