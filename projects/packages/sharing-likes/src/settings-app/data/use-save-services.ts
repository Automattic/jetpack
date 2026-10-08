import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { saveServices } from './api';
import { errorMessage } from './error-message';
import { MUTATION_SCOPE, SAVE_SERVICES_KEY, SAVE_SETTING_KEY, queryKeys } from './queries';
import type { Services } from '../types';

export interface ServiceLists {
	visible: string[];
	hidden: string[];
}

export interface SaveServicesOptions {
	message?: string;
	undoable?: boolean;
}

export type SaveServices = (
	lists: ServiceLists,
	options?: SaveServicesOptions
) => Promise< Services | undefined >;

interface ServicesChange extends ServiceLists {
	previous: ServiceLists;
}

// One snackbar for a run of moves, rather than one per tap.
const SAVED_NOTICE_ID = 'sharing-likes-services-saved';

/**
 * Whether two pairs of lists hold the same services in the same order.
 *
 * @param a - Lists.
 * @param b - Lists.
 * @return Whether they match.
 */
function sameLists( a: ServiceLists, b: ServiceLists ): boolean {
	return JSON.stringify( [ a.visible, a.hidden ] ) === JSON.stringify( [ b.visible, b.hidden ] );
}

/**
 * Save the enabled services optimistically, rolling back if the server refuses.
 *
 * @return Save function, resolving to the saved services or undefined on failure.
 */
export function useSaveServices(): SaveServices {
	const queryClient = useQueryClient();
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const isLastSave = () => queryClient.isMutating( { mutationKey: SAVE_SERVICES_KEY } ) <= 1;

	const { mutateAsync } = useMutation( {
		mutationKey: SAVE_SERVICES_KEY,
		scope: MUTATION_SCOPE,
		mutationFn: ( { visible, hidden }: ServicesChange ) => saveServices( visible, hidden ),
		onSuccess: saved => {
			// Each response carries both lists, so one landing while another save waits would undo that save's order.
			if ( isLastSave() ) {
				queryClient.cancelQueries( { queryKey: queryKeys.services } );
				queryClient.setQueryData( queryKeys.services, saved );
			}
		},
		onError: ( error, { visible, hidden, previous } ) => {
			// A later change replaced these lists, and its own save settles them.
			queryClient.setQueryData< Services >( queryKeys.services, current =>
				current && sameLists( current, { visible, hidden } ) ? { ...current, ...previous } : current
			);
			createErrorNotice(
				errorMessage(
					error,
					__( 'Your sharing buttons could not be saved.', 'jetpack-sharing-likes' )
				),
				{ type: 'snackbar' }
			);
			if ( isLastSave() ) {
				queryClient.invalidateQueries( { queryKey: queryKeys.services } );
			}
		},
		// A refusal usually means the screen is stale, and an empty list hands a block theme's section to the block.
		onSettled: ( _saved, error, { visible, hidden } ) =>
			! error && visible.length + hidden.length > 0
				? undefined
				: Promise.all( [
						queryClient.invalidateQueries( { queryKey: queryKeys.status } ),
						queryClient.isMutating( { mutationKey: SAVE_SETTING_KEY } ) > 0
							? undefined
							: queryClient.invalidateQueries( { queryKey: queryKeys.settings } ),
					] ),
	} );

	return useCallback(
		async function save( lists: ServiceLists, { message, undoable }: SaveServicesOptions = {} ) {
			// An in-flight read would land on top of the optimistic lists.
			queryClient.cancelQueries( { queryKey: queryKeys.services } );
			const current = queryClient.getQueryData< Services >( queryKeys.services );
			const previous = { visible: current?.visible ?? [], hidden: current?.hidden ?? [] };
			queryClient.setQueryData< Services >(
				queryKeys.services,
				data => data && { ...data, ...lists }
			);

			try {
				const saved = await mutateAsync( { ...lists, previous } );
				createSuccessNotice( message ?? __( 'Settings have been saved', 'jetpack-sharing-likes' ), {
					id: SAVED_NOTICE_ID,
					type: 'snackbar',
					actions: undoable
						? [
								{
									label: __( 'Undo', 'jetpack-sharing-likes' ),
									onClick: () => save( previous ),
								},
							]
						: undefined,
				} );
				return saved;
			} catch {
				return undefined;
			}
		},
		[ createSuccessNotice, mutateAsync, queryClient ]
	);
}
