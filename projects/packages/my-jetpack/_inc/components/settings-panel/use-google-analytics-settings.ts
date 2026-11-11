import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useCallback, useState } from 'react';
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
 * The asked-for values show until the save settles.
 *
 * @return The settings once loaded, whether the read failed, whether a save is running, and the saver.
 */
export function useGoogleAnalyticsSettings() {
	const queryClient = useQueryClient();
	const { createErrorNotice, createSuccessNotice } = useDispatch( noticesStore );
	const [ requested, setRequested ] = useState< Partial< GoogleAnalyticsSettings > | null >( null );
	const { data, isError } = useQuery( {
		queryKey: QUERY_KEY,
		queryFn: () => apiFetch< GoogleAnalyticsSettings >( { path: PATH } ),
	} );

	const save = useCallback(
		async ( changes: Partial< GoogleAnalyticsSettings > ) => {
			setRequested( changes );
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
				setRequested( null );
			}
		},
		[ queryClient, createErrorNotice, createSuccessNotice ]
	);

	return {
		settings: data ? { ...data, ...requested } : undefined,
		isError,
		isSaving: requested !== null,
		save,
	};
}
