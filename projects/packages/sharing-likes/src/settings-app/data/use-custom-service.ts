import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { createCustomService, deleteCustomService, updateCustomService } from './api';
import { errorMessage } from './error-message';
import { CUSTOM_SERVICE_KEY, MUTATION_SCOPE, queryKeys } from './queries';
import { useSaveServices, type ServiceLists } from './use-save-services';
import type { CustomServiceFields, Service, ServiceRow, Services } from '../types';

/**
 * A custom-service write in the screen's write scope, with its error snackbar.
 *
 * @param mutationFn - Request.
 * @return Mutate function.
 */
function useCustomServiceMutation< Variables, Result >(
	mutationFn: ( variables: Variables ) => Promise< Result >
) {
	const { createErrorNotice } = useDispatch( noticesStore );
	return useMutation( {
		mutationKey: CUSTOM_SERVICE_KEY,
		scope: MUTATION_SCOPE,
		mutationFn,
		onError: error =>
			createErrorNotice(
				errorMessage(
					error,
					__( 'The custom service could not be saved.', 'jetpack-sharing-likes' )
				),
				{ type: 'snackbar' }
			),
	} ).mutateAsync;
}

/**
 * Change the arguments of `updateCustomService()` into one mutation variable.
 *
 * @param change        - Change.
 * @param change.id     - Service ID.
 * @param change.fields - New fields.
 * @return The service as saved.
 */
const updateService = ( { id, fields }: { id: string; fields: CustomServiceFields } ) =>
	updateCustomService( id, fields );

/**
 * Create, edit and delete custom services.
 *
 * @return Operations, each resolving to whether it went through.
 */
export function useCustomService() {
	const queryClient = useQueryClient();
	const saveLists = useSaveServices();
	const { createSuccessNotice } = useDispatch( noticesStore );
	const createMutation = useCustomServiceMutation( createCustomService );
	const updateMutation = useCustomServiceMutation( updateService );
	const deleteMutation = useCustomServiceMutation( deleteCustomService );

	const cached = useCallback(
		() => queryClient.getQueryData< Services >( queryKeys.services ),
		[ queryClient ]
	);
	const setServices = useCallback(
		( update: ( list: Service[] ) => Service[] ) =>
			queryClient.setQueryData< Services >(
				queryKeys.services,
				data => data && { ...data, services: update( data.services ) }
			),
		[ queryClient ]
	);
	const notifySaved = useCallback(
		() =>
			createSuccessNotice( __( 'Settings have been saved', 'jetpack-sharing-likes' ), {
				type: 'snackbar',
			} ),
		[ createSuccessNotice ]
	);

	const create = useCallback(
		async ( fields: CustomServiceFields, row: ServiceRow ) => {
			let service: Service;
			try {
				service = await createMutation( fields );
			} catch {
				return false;
			}
			setServices( list => [ ...list, service ] );
			// Read now rather than before the request: moves made meanwhile are already in the cache.
			const data = cached();
			const lists: ServiceLists = { visible: data?.visible ?? [], hidden: data?.hidden ?? [] };
			await saveLists( { ...lists, [ row ]: [ ...lists[ row ], service.id ] } );
			return true;
		},
		[ cached, createMutation, saveLists, setServices ]
	);

	const update = useCallback(
		async ( id: string, fields: CustomServiceFields ) => {
			try {
				const service = await updateMutation( { id, fields } );
				setServices( list => list.map( item => ( item.id === id ? service : item ) ) );
				notifySaved();
				return true;
			} catch {
				return false;
			}
		},
		[ notifySaved, setServices, updateMutation ]
	);

	const remove = useCallback(
		async ( id: string ) => {
			try {
				await deleteMutation( id );
			} catch {
				return false;
			}
			setServices( list => list.filter( item => item.id !== id ) );
			const data = cached();
			if ( data && ( data.visible.includes( id ) || data.hidden.includes( id ) ) ) {
				await saveLists( {
					visible: data.visible.filter( other => other !== id ),
					hidden: data.hidden.filter( other => other !== id ),
				} );
			} else {
				notifySaved();
			}
			return true;
		},
		[ cached, deleteMutation, notifySaved, saveLists, setServices ]
	);

	return useMemo( () => ( { create, update, remove } ), [ create, update, remove ] );
}
