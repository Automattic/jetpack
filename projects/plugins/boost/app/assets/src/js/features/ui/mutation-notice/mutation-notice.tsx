import React, { useEffect, useState } from 'react';
import { Snackbar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Mutation Notice: A component that shows a notice when a mutation is pending, successful or failed.
 *
 * Usage:
 * ```tsx
 *	 <MutationNotice
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
 * @param props.isSuccess      Whether the mutation was successful.
 * @param props.isError        Whether the mutation failed.
 * @param props.isPending      Whether the mutation is pending.
 * @param props.savingMessage  The message to show when the mutation is pending.
 * @param props.errorMessage   The message to show when the mutation failed.
 * @param props.successMessage The message to show when the mutation was successful.
 */
export const MutationNotice = ( props: {
	isSuccess: boolean;
	isError: boolean;
	isPending: boolean;
	savingMessage?: string;
	errorMessage?: string;
	successMessage?: string;
} ) => {
	const [ showSnackbar, setShowSnackbar ] = useState( false );
	const [ snackbarContent, setSnackbarContent ] = useState( '' );
	const [ snackbarType, setSnackbarType ] = useState< 'success' | 'error' >( 'success' );

	const savingMessage = props.savingMessage || __( 'Saving…', 'jetpack-boost' );
	const errorMessage =
		props.errorMessage || __( 'An error occurred while saving changes.', 'jetpack-boost' );
	const successMessage = props.successMessage || __( 'Changes saved.', 'jetpack-boost' );

	useEffect( () => {
		let timeoutId: ReturnType< typeof setTimeout >;

		// If mutation is pending, show a "Saving…" message.
		// But only if saving takes more than 50ms to avoid FOLC(Flash of Loading Content).
		if ( props.isPending && ! props.isSuccess ) {
			timeoutId = setTimeout( () => {
				setShowSnackbar( true );
				setSnackbarContent( savingMessage );
			}, 50 );
			setSnackbarType( 'success' );
		} else if ( props.isSuccess ) {
			setShowSnackbar( true );
			setSnackbarContent( successMessage );
			setSnackbarType( 'success' );
		} else if ( props.isError ) {
			setShowSnackbar( true );
			setSnackbarContent( errorMessage );
			setSnackbarType( 'error' );
		}
		return () => clearTimeout( timeoutId );
	}, [
		props.isSuccess,
		props.isError,
		props.isPending,
		savingMessage,
		errorMessage,
		successMessage,
	] );

	return (
		<>
			{ showSnackbar && (
				<Snackbar type={ snackbarType } onDismiss={ () => setShowSnackbar( false ) }>
					{ snackbarContent }
				</Snackbar>
			) }
		</>
	);
};

// This is a pure component, so we can use React.memo to avoid unnecessary re-renders.
export default React.memo( MutationNotice );
