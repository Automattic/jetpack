import restApi from '@automattic/jetpack-api';
import { Col, Text } from '@automattic/jetpack-components';
import { useConnectionErrorNotice, useRestoreConnection } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import { useContext, useEffect, useState, useCallback } from 'react';
import { NOTICE_PRIORITY_HIGH } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import useAnalytics from '../use-analytics';
import type { NoticeOptions } from '../../context/notices/types';

// Define NoticeAction type since it's not exported
interface NoticeAction {
	label: string;
	onClick: () => void;
	isLoading?: boolean;
	loadingText?: string;
	noDefaultClasses?: boolean;
	variant?: 'primary' | 'secondary';
}

// Define ConnectionError interface
interface ConnectionError {
	message: string;
	code: string;
	action: string;
	data: {
		api_error_code?: string;
		[ key: string ]: unknown;
	};
	error_type?: string;
}

const useConnectionErrorsNotice = () => {
	const { setNotice, currentNotice } = useContext( NoticeContext );
	const { hasConnectionError, connectionErrorMessage } = useConnectionErrorNotice();
	const { restoreConnection, isRestoringConnection, restoreConnectionError } =
		useRestoreConnection();
	const { recordEvent } = useAnalytics();
	const [ isFixing, setIsFixing ] = useState( false );
	const [ fixingType, setFixingType ] = useState< string | null >( null );
	const [ fixError, setFixError ] = useState< string | null >( null );
	const [ fixSuccess, setFixSuccess ] = useState( false );

	// Extract the connection error details from the connection data
	const getConnectionError = useCallback( () => {
		// Get errors from window.Initial_State
		// @ts-expect-error - Property 'connectionErrors' might not exist on type
		const myJetpackErrors = window?.Initial_State?.connectionErrors || [];

		if ( Array.isArray( myJetpackErrors ) && myJetpackErrors.length > 0 ) {
			const firstError = myJetpackErrors[ 0 ];
			return {
				message: firstError.message,
				code: firstError.data?.api_error_code || firstError.code,
				action: firstError.action,
				data: firstError.data || {},
				error_type: firstError.error_type || 'connection',
			} as ConnectionError;
		}

		return null;
	}, [] );

	// Add a new handler for redirecting to create new user page
	const handleCreateMissingAccount = useCallback( () => {
		// Track the attempt to use create missing account
		recordEvent( 'jetpack_my_jetpack_protected_owner_create_account_attempt', {} );

		// Navigate to the WordPress Add New User admin page
		const initialState = window?.Initial_State as { adminUrl?: string } | undefined;
		window.location.href = ( initialState?.adminUrl || '/wp-admin/' ) + 'user-new.php';
	}, [ recordEvent ] );

	// Handle protected owner errors (automated fix)
	const handleProtectedOwnerFix = useCallback( () => {
		setIsFixing( true );
		setFixingType( 'permanent' );
		setFixError( null );

		// Get the error details
		const errorDetails = getConnectionError();
		if ( ! errorDetails ) {
			setIsFixing( false );
			setFixError( __( 'Could not determine the error details', 'jetpack-my-jetpack' ) );
			return;
		}

		// Get the current user information from Initial_State
		const initialState = window?.Initial_State as
			| {
					currentUser?: { id?: number; email?: string };
			  }
			| undefined;

		const currentUserId = initialState?.currentUser?.id;
		const currentUserEmail = initialState?.currentUser?.email;

		if ( ! currentUserId || ! currentUserEmail ) {
			setIsFixing( false );
			setFixError( __( 'Could not determine the current user information', 'jetpack-my-jetpack' ) );
			return;
		}

		// Track the attempt to fix the error
		recordEvent( 'jetpack_my_jetpack_protected_owner_automated_fix_attempt', {
			error_code: errorDetails.code,
			user_id: currentUserId,
		} );

		// Call the local REST API endpoint
		restApi.req
			.post( {
				path: '/wpcomsh/v1/protected-owner-fix',
				body: {
					fix_type: 'permanent',
					error_code: errorDetails.code,
					error_data: {
						...errorDetails.data,
						current_user_id: currentUserId,
						current_user_email: currentUserEmail,
					},
				},
			} )
			.then( () => {
				setIsFixing( false );
				setFixSuccess( true );

				// Track the successful fix
				recordEvent( 'jetpack_my_jetpack_protected_owner_automated_fix_success', {
					error_code: errorDetails.code,
				} );

				// Refresh the page after a short delay to show the updated status
				setTimeout( () => {
					window.location.reload();
				}, 1500 );
			} )
			.catch( error => {
				setIsFixing( false );
				setFixError(
					error.message ||
						__( 'An error occurred while trying to fix the connection', 'jetpack-my-jetpack' )
				);

				// Track the failed fix
				recordEvent( 'jetpack_my_jetpack_protected_owner_automated_fix_error', {
					error_code: errorDetails.code,
					error_message: error.message,
				} );
			} );
	}, [ recordEvent, getConnectionError ] );

	useEffect( () => {
		// Check for errors using the connection error notice hook
		if ( ! hasConnectionError ) {
			// No errors detected by the hook
			return;
		}

		// Get connection error details
		const connectionError = getConnectionError();
		if ( ! connectionError ) {
			return;
		}

		const errorAction = connectionError?.action;
		const isProtectedOwnerError = errorAction === 'protected_owner_action';

		// Use the error message provided by the backend
		let errorMessage = connectionError.message || connectionErrorMessage;

		if ( restoreConnectionError ) {
			errorMessage = (
				<Col>
					<Text mb={ 2 }>
						{ sprintf(
							/* translators: placeholder is the error. */
							__( 'There was an error reconnecting Jetpack. Error: %s', 'jetpack-my-jetpack' ),
							restoreConnectionError
						) }
					</Text>
					<Text mb={ 2 }>{ connectionErrorMessage }</Text>
				</Col>
			);
		}

		// If we're fixing a protected owner error
		if ( isFixing ) {
			const actionText = __( 'Enabling automated fix…', 'jetpack-my-jetpack' );

			const noticeOptions: NoticeOptions = {
				id: 'connection-error-notice',
				level: 'info',
				priority: NOTICE_PRIORITY_HIGH + 1,
			};

			setNotice( {
				message: (
					<Col>
						<Text mb={ 2 }>{ errorMessage }</Text>
						<Text mb={ 2 }>{ actionText }</Text>
					</Col>
				),
				options: noticeOptions,
			} );
			return;
		}

		// If there was an error during the fix
		if ( fixError ) {
			const noticeOptions: NoticeOptions = {
				id: 'connection-error-notice',
				level: 'error',
				actions: [
					{
						label: __( 'Try Again', 'jetpack-my-jetpack' ),
						onClick: () => handleProtectedOwnerFix(),
						noDefaultClasses: true,
					},
				],
				priority: NOTICE_PRIORITY_HIGH,
			};

			setNotice( {
				message: fixError,
				options: noticeOptions,
			} );
			return;
		}

		// If the fix was successful
		if ( fixSuccess ) {
			const noticeOptions: NoticeOptions = {
				id: 'connection-error-notice',
				level: 'success',
				priority: NOTICE_PRIORITY_HIGH,
			};

			setNotice( {
				message: __( 'Automated fix enabled successfully! Refreshing…', 'jetpack-my-jetpack' ),
				options: noticeOptions,
			} );
			return;
		}

		// Add action buttons based on error type
		let noticeActions: NoticeAction[] = [];
		if ( isProtectedOwnerError ) {
			// Protected owner mismatch error - add "Create missing account" and "Enable automated fix" buttons
			noticeActions = [
				{
					label: __( 'Create missing account', 'jetpack-my-jetpack' ),
					onClick: handleCreateMissingAccount,
					noDefaultClasses: true,
					variant: 'secondary',
				},
				{
					label: __( 'Enable automated fix', 'jetpack-my-jetpack' ),
					onClick: handleProtectedOwnerFix,
					noDefaultClasses: true,
					variant: 'primary',
				},
			];
		} else {
			// Standard connection error - add "Restore Connection" button
			const onCtaClick = () => {
				restoreConnection();
				recordEvent( 'jetpack_my_jetpack_connection_error_notice_reconnect_cta_click' );
			};

			noticeActions = [
				{
					label: __( 'Restore Connection', 'jetpack-my-jetpack' ),
					onClick: onCtaClick,
					isLoading: isRestoringConnection,
					loadingText: __( 'Reconnecting Jetpack…', 'jetpack-my-jetpack' ),
					noDefaultClasses: true,
				},
			];
		}

		const noticeOptions: NoticeOptions = {
			id: 'connection-error-notice',
			level: 'error',
			actions: noticeActions,
			priority: NOTICE_PRIORITY_HIGH + ( isRestoringConnection ? 1 : 0 ),
		};

		setNotice( {
			message: errorMessage,
			options: noticeOptions,
		} );
	}, [
		setNotice,
		recordEvent,
		hasConnectionError,
		connectionErrorMessage,
		restoreConnection,
		isRestoringConnection,
		restoreConnectionError,
		currentNotice.options.priority,
		isFixing,
		fixingType,
		fixError,
		fixSuccess,
		handleProtectedOwnerFix,
		handleCreateMissingAccount,
		getConnectionError,
	] );
};

export default useConnectionErrorsNotice;
