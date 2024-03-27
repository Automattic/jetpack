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
 * Mutation Notice: A hook for showing a notice when a mutation is pending, successful or failed.
 *
 * Usage:
 * ```tsx
 *	useMutationNotice( {
 *		"unique-mutation-id",
 *		mutationState,
 *		{
 *			savingMessage: 'Saving…',
 *			errorMessage: 'An error occurred while saving changes. Please, try again.',
 *			successMessage: 'Changes saved.',
 *		}
 *	} );
 * ```
 *
 * Usage when you don't need to customize the messages:
 *
 * ```tsx
 * 	const [ data, mutation ] = useDataSync(...);
 * 	<MutationNotice { ...mutation } />
 * ```
 * @param mutationId    A unique identifier for the mutation notice.
 * @param mutationState An object representing the current state of the mutation.
 * @param messages      An object containing custom messages for different states of the mutation.
 */
export const useMutationNotice = (
	mutationId: string,
	mutationState: MutationNoticeState | null = null,
	messages: MutationNoticeMessages = {}
) => {
	const { setNotice, removeNotice } = useNotices();

	const defaultMessages = {
		savingMessage: __( 'Saving…', 'jetpack-boost' ),
		errorMessage: __(
			'An error occurred while saving changes. Please, try again.',
			'jetpack-boost'
		),
		successMessage: __( 'Changes saved.', 'jetpack-boost' ),
	};

	const { savingMessage, errorMessage, successMessage } = { ...defaultMessages, ...messages };

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
		if ( isPending ) {
			setNotice( { id: mutationId, type: 'pending', message: savingMessage } );
		} else if ( isSuccess ) {
			setNotice( { id: mutationId, type: 'success', message: successMessage } );
		} else if ( isError ) {
			setNotice( { id: mutationId, type: 'error', message: errorMessage } );
		}
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
	] );

	return [ () => removeNotice( mutationId ) ];
};

// This is a pure component, so we can use React.memo to avoid unnecessary re-renders.
export default useMutationNotice;
