import { useEffect, useMemo } from 'react';
import { __ } from '@wordpress/i18n';
import { useNotices } from '$features/notice/context';

export type MutationNoticeState = {
	isSuccess: boolean;
	isError: boolean;
	isPending: boolean;
	isIdle: boolean;
	reset?: () => void;
};

type MutationNoticeMessages = {
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
 * @param mutationId
 * @param props.mutationId        The unique identifier for the mutation.
 * @param props.isSuccess         Whether the mutation was successful.
 * @param props.isError           Whether the mutation failed.
 * @param props.isPending         Whether the mutation is pending.
 * @param messages
 * @param messages.savingMessage  The message to show when the mutation is pending.
 * @param messages.errorMessage   The message to show when the mutation failed.
 * @param messages.successMessage The message to show when the mutation was successful.
 * @param mutationState
 */
export const useMutationNotice = (
	mutationId: string,
	mutationState: MutationNoticeState | null = null,
	messages: MutationNoticeMessages = {}
) => {
	const { setNotice, hasNotice, removeNotice } = useNotices();

	const defaultMessages = {
		savingMessage: __( 'Saving…', 'jetpack-boost' ),
		errorMessage: __(
			'An error occurred while saving changes. Please, try again.',
			'jetpack-boost'
		),
		successMessage: __( 'Changes saved.', 'jetpack-boost' ),

	};

	const {
		savingMessage,
		errorMessage,
		successMessage,
	} = {...defaultMessages, ...messages};


	const { isSuccess, isError, isPending, isIdle, reset } = useMemo( () => {
		const mutationStateDefaults = {
			isSuccess: false,
			isError: false,
			isPending: false,
			isIdle: false,
			reset: () => {},
		};
		return {
			...mutationStateDefaults,
			...mutationState,
		};
	}, [ mutationState ] );

	useEffect( () => {
		let timeout: number;
		if( isIdle && hasNotice( mutationId ) ) {
			removeNotice( mutationId );
		}
		if ( isPending && ! isSuccess ) {
			setNotice( { id: mutationId, type: 'pending', message: savingMessage } );
		} else if ( isSuccess ) {
			setNotice( { id: mutationId, type: 'success', message: successMessage } );
			timeout = setTimeout( () => {
				reset();
			}, 5000 );
		} else if ( isError ) {
			setNotice( { id: mutationId, type: 'error', message: errorMessage } );
		}

		// Cleanup function to remove notice when the component unmounts or if the mutationId changes
		return () => {
			clearTimeout( timeout );
		};
	}, [
		mutationId,
		setNotice,
		removeNotice,
		savingMessage,
		errorMessage,
		successMessage,
		isSuccess,
		isError,
		isPending,
		isIdle,
		reset,
		hasNotice,
	] );

};

// This is a pure component, so we can use React.memo to avoid unnecessary re-renders.
export default useMutationNotice;
