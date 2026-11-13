import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useCallback, useRef, useState } from 'react';
import { QUERY_KEY as FEATURES_QUERY_KEY } from '../my-jetpack-tab-panel/features/use-main-features';

export type GoogleAnalyticsSettings = {
	is_active: boolean;
	code: string;
	anonymize_ip: boolean;
};

const PATH = '/my-jetpack/v1/site/google-analytics';
const QUERY_KEY = [ 'my-jetpack-google-analytics' ];

/**
 * The built-in Google Analytics setup, read and saved through My Jetpack's own route.
 *
 * Saves run one at a time: the route reads, merges and writes one option, so two at once could drop a change.
 *
 * @return The settings (each showing its asked-for value until its save settles), whether the read failed, which settings are saving, and the saver.
 */
export function useGoogleAnalyticsSettings() {
	const queryClient = useQueryClient();
	const { createErrorNotice, createSuccessNotice } = useDispatch( noticesStore );
	const [ pending, setPending ] = useState< Partial< GoogleAnalyticsSettings > >( {} );
	const queue = useRef< Promise< unknown > >( Promise.resolve() );
	const { data, isError } = useQuery( {
		queryKey: QUERY_KEY,
		queryFn: () => apiFetch< GoogleAnalyticsSettings >( { path: PATH } ),
	} );

	const send = useCallback(
		async ( changes: Partial< GoogleAnalyticsSettings > ) => {
			try {
				const saved = await apiFetch< GoogleAnalyticsSettings >( {
					path: PATH,
					method: 'POST',
					data: changes,
				} );
				queryClient.setQueryData( QUERY_KEY, saved );
				// The Features row's badge depends on both the switch and the ID.
				queryClient.invalidateQueries( { queryKey: FEATURES_QUERY_KEY } );
				createSuccessNotice( __( 'Updated settings.', 'jetpack-my-jetpack' ), {
					type: 'snackbar',
				} );
				return true;
			} catch ( error ) {
				createErrorNotice(
					( error as { message?: string } )?.message ||
						__( 'Failed to save the setting.', 'jetpack-my-jetpack' ),
					{ type: 'snackbar' }
				);
				return false;
			} finally {
				// A later save of the same setting keeps its own pending value.
				setPending( current => {
					const next = { ...current };
					for ( const key of Object.keys( changes ) as ( keyof GoogleAnalyticsSettings )[] ) {
						if ( next[ key ] === changes[ key ] ) {
							delete next[ key ];
						}
					}
					return next;
				} );
			}
		},
		[ queryClient, createErrorNotice, createSuccessNotice ]
	);

	const save = useCallback(
		( changes: Partial< GoogleAnalyticsSettings > ) => {
			setPending( current => ( { ...current, ...changes } ) );
			const result = queue.current.then( () => send( changes ) );
			queue.current = result;
			return result;
		},
		[ send ]
	);

	const isSaving = useCallback(
		( setting: keyof GoogleAnalyticsSettings ) => Object.hasOwn( pending, setting ),
		[ pending ]
	);

	return {
		settings: data ? { ...data, ...pending } : undefined,
		isError,
		isSaving,
		save,
	};
}
