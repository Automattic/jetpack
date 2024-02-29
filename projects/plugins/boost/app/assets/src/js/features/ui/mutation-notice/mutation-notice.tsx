import React, { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { useNotices } from '$features/notice/context';

type MutationNoticeProps = {
	mutationId: string;
	isSuccess: boolean;
	isError: boolean;
	isPending: boolean;
	savingMessage?: string;
	errorMessage?: string;
	successMessage?: string;
};

/**
 * Mutation Notice: A component that shows a notice when a mutation is pending, successful or failed.
 *
 * Usage:
 * ```tsx
 *	 <MutationNotice
 *		 mutationId="unique-mutation-id"
 *		 isSuccess={ mutation.isSuccess }
 *		 isError={ mutation.isError }
 *		 isPending={ mutation.isPending }
 *		 savingMessage={ __( 'Saving…', 'jetpack-boost' ) }
 *		 errorMessage={ __(
 *		 'An error occurred while saving changes. Please, try again.',
 *		 'jetpack-boost'
 *		 ) }
 *		 successMessage={ __( 'Changes saved.', 'jetpack-boost' ) }
 *		 />
 * ```
 *
 * Usage when you don't need to customize the messages:
 *
 * ```tsx
 * 	const [ data, mutation ] = useDataSync(...);
 * 	<MutationNotice { ...mutation } />
 * ```
 * @param props
 * @param props.mutationId     The unique identifier for the mutation.
 * @param props.isSuccess      Whether the mutation was successful.
 * @param props.isError        Whether the mutation failed.
 * @param props.isPending      Whether the mutation is pending.
 * @param props.savingMessage  The message to show when the mutation is pending.
 * @param props.errorMessage   The message to show when the mutation failed.
 * @param props.successMessage The message to show when the mutation was successful.
 */
export const MutationNotice = ( {
	mutationId,
	isSuccess,
	isError,
	isPending,
	savingMessage = __( 'Saving…', 'jetpack-boost' ),
	errorMessage = __( 'An error occurred while saving changes.', 'jetpack-boost' ),
	successMessage = __( 'Changes saved.', 'jetpack-boost' ),
}: MutationNoticeProps ) => {
	const { setNotice, removeNotice } = useNotices();

	useEffect( () => {
		let timeout: number;
		if ( isPending && ! isSuccess ) {
			setNotice( { id: mutationId, type: 'pending', message: savingMessage } );
		} else if ( isSuccess ) {
			setNotice( { id: mutationId, type: 'success', message: successMessage } );
			timeout = setTimeout( () => {
				removeNotice( mutationId );
			}, 5000 );
		} else if ( isError ) {
			setNotice( { id: mutationId, type: 'error', message: errorMessage } );
		}

		// Cleanup function to remove notice when the component unmounts or if the mutationId changes
		return () => {
			clearTimeout( timeout );
			removeNotice( mutationId );
		};
	}, [
		setNotice,
		removeNotice,
		isSuccess,
		isError,
		isPending,
		savingMessage,
		errorMessage,
		successMessage,
		mutationId,
	] );

	return null;
};

// This is a pure component, so we can use React.memo to avoid unnecessary re-renders.
export default React.memo( MutationNotice );
