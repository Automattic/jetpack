import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { backup } from '@wordpress/icons';
import { useMemo } from 'react';
import type { Activity } from './types';
import type { Action } from '@wordpress/dataviews';

interface InitialStateWithCalypsoSlug {
	jetpackStatus?: { calypsoSlug?: string };
}

declare const JPACTIVITYLOG_INITIAL_STATE: InitialStateWithCalypsoSlug | undefined;

// Read once at module load; the value doesn't change within a session.
const calypsoSlug: string =
	( typeof JPACTIVITYLOG_INITIAL_STATE !== 'undefined'
		? JPACTIVITYLOG_INITIAL_STATE?.jetpackStatus?.calypsoSlug
		: undefined ) ?? '';

type Tracks = { recordEvent: ( name: string, props?: Record< string, unknown > ) => void };

type UseActivityActionsOptions = {
	isLoading: boolean;
	tracks?: Tracks;
};

/**
 * Row actions for the DataViews table. The single primary action deep-
 * links into the Jetpack Cloud Backup restore flow for the row's rewind
 * point (`https://cloud.jetpack.com/backup/{slug}/restore/{rewindId}`)
 * and opens in a new tab. Eligibility requires `activityIsRewindable`,
 * a `rewindId`, and a `calypsoSlug` from Initial_State; rows missing
 * any of those don't render the action.
 *
 * TEMPORARY: this off-site link is a stop-gap until the Backup wp-admin
 * port (https://github.com/Automattic/jetpack/pull/48236) lands. Once
 * that ships, every row action here should point at the in-admin
 * Backup page instead of cloud.jetpack.com so users stay inside their
 * own wp-admin for the restore flow.
 *
 * @param options           - Hook options.
 * @param options.isLoading - Whether the list is currently fetching. Kept
 *                          in the API for symmetry with the call site.
 * @param options.tracks    - Optional analytics handle for the click event.
 * @return The actions array for `<DataViews actions=… />`.
 */
export function useActivityActions( {
	isLoading,
	tracks,
}: UseActivityActionsOptions ): Action< Activity >[] {
	return useMemo( () => {
		const backupAction: Action< Activity > = {
			id: 'backup',
			isPrimary: true,
			label: __( 'Restore backup', 'jetpack-activity-log' ),
			icon: <Icon icon={ backup } />,
			isEligible: item => Boolean( item.activityIsRewindable && item.rewindId && calypsoSlug ),
			callback: async items => {
				const item = items[ 0 ];
				if ( ! item?.rewindId || ! calypsoSlug ) {
					return;
				}
				const url = `https://cloud.jetpack.com/backup/${ encodeURIComponent(
					calypsoSlug
				) }/restore/${ encodeURIComponent( item.rewindId ) }`;
				tracks?.recordEvent( 'jetpack_activity_log_restore_backup_click', {
					rewind_id: item.rewindId,
					activity_name: item.activityName,
				} );
				window.open( url, '_blank', 'noopener,noreferrer' );
			},
		};

		// Keep the flag referenced so the param isn't flagged as unused.
		void isLoading;

		return [ backupAction ];
	}, [ isLoading, tracks ] );
}
