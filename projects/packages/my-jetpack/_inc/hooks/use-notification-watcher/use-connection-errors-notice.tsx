import restApi from '@automattic/jetpack-api';
import { Col, Text } from '@automattic/jetpack-components';
import {
	useConnectionErrorNotice,
	useRestoreConnection,
	useConnection,
} from '@automattic/jetpack-connection';
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

/**
 * Get error message for protected owner errors
 *
 * @param {string} errorCode - The error code
 * @return {string} The localized error message
 */
const getProtectedOwnerErrorMessage = ( errorCode: string ): string => {
	switch ( errorCode ) {
		case 'owner_connected_wrong_wpcom_account':
			return __(
				'The current connection owner has connected with a different WordPress.com account than the protected owner.',
				'jetpack-my-jetpack'
			);
		case 'wrong_owner_protected_owner_exists':
			return __(
				'The WordPress.com owner account exists on this site but is not the connection owner.',
				'jetpack-my-jetpack'
			);
		case 'wrong_owner_protected_owner_missing':
			return __(
				'The WordPress.com owner account does not exist on this site.',
				'jetpack-my-jetpack'
			);
		case 'self_heal_protected_owner_missing':
			return __(
				'WordPress.com detected that the owner account is missing.',
				'jetpack-my-jetpack'
			);
		default:
			return __(
				'There is an issue with the protected owner account connection.',
				'jetpack-my-jetpack'
			);
	}
};

const useConnectionErrorsNotice = () => {
	const { setNotice, currentNotice } = useContext( NoticeContext );
	const { hasConnectionError, connectionErrorMessage } = useConnectionErrorNotice();
	const { restoreConnection, isRestoringConnection, restoreConnectionError } =
		useRestoreConnection();
	const { connectionErrors } = useConnection( {} );
	const { recordEvent } = useAnalytics();
	const [ isFixing, setIsFixing ] = useState( false );
	const [ fixingType, setFixingType ] = useState< string | null >( null );
	const [ fixError, setFixError ] = useState< string | null >( null );
	const [ fixSuccess, setFixSuccess ] = useState( false );
	// Track if we have protected owner errors
	const [ hasProtectedOwnerError, setHasProtectedOwnerError ] = useState( false );

	// Extract the connection error details from the connection data
	const getConnectionError = useCallback( () => {
		// Try to handle the nested error format from protected owner errors
		if ( connectionErrors && typeof connectionErrors === 'object' ) {
			try {
				// The error structure is: { error_type: { user_id: { error_details } } }
				const errorType = Object.keys( connectionErrors )[ 0 ];
				if ( errorType ) {
					const userErrors = connectionErrors[ errorType ];
					const userId = Object.keys( userErrors )[ 0 ];
					if ( userId ) {
						const errorDetails = userErrors[ userId ];

						// If we found valid error details
						if ( errorDetails && errorDetails.error_code ) {
							// Determine action based on error type
							let action = 'reconnect';
							if ( errorDetails.error_type === 'protected_owner' ) {
								action =
									errorDetails.error_code === 'self_heal_protected_owner_missing'
										? 'self_heal_action'
										: 'protected_owner_action';
							}

							return {
								message: `Protected owner error: ${ errorDetails.error_code }`,
								code: errorDetails.error_code,
								action: action,
								data: {
									api_error_code: errorDetails.error_code,
									...( errorDetails.error_data || {} ),
								},
								error_type: errorDetails.error_type,
							} as ConnectionError;
						}
					}
				}
			} catch {
				// If any error in parsing, we'll fall back to standard error format
			}
		}

		// Fall back to standard array format for errors
		// @ts-expect-error - Property 'connectionErrors' might not exist on type
		const myJetpackErrors = window?.Initial_State?.connectionErrors || [];

		if ( Array.isArray( myJetpackErrors ) && myJetpackErrors.length > 0 ) {
			const firstError = myJetpackErrors[ 0 ];
			return {
				message: firstError.message,
				code: firstError.data?.api_error_code || firstError.code,
				action: firstError.action,
				data: firstError.data,
			} as ConnectionError;
		}

		return null;
	}, [ connectionErrors ] );

	// Handle protected owner errors (fix once or fix always)
	const handleProtectedOwnerFix = useCallback(
		( fixType: string ) => {
			setIsFixing( true );
			setFixingType( fixType );
			setFixError( null );

			// Get the error details
			const errorDetails = getConnectionError();
			if ( ! errorDetails ) {
				setIsFixing( false );
				setFixError( __( 'Could not determine the error details', 'jetpack-my-jetpack' ) );
				return;
			}

			// Track the attempt to fix the error
			recordEvent( 'jetpack_my_jetpack_protected_owner_fix_attempt', {
				fix_type: fixType,
				error_code: errorDetails.code,
			} );

			// Get the blog ID from the Initial_State
			const initialState = window?.Initial_State as
				| {
						siteConnectionData?: { blogId?: string | number };
				  }
				| undefined;

			const blogId = initialState?.siteConnectionData?.blogId;
			if ( ! blogId ) {
				setIsFixing( false );
				setFixError( __( 'Could not determine the site ID', 'jetpack-my-jetpack' ) );
				return;
			}

			// Call the WordPress.com endpoint
			restApi.req
				.post( {
					// This is a WordPress.com API request rather than a local REST API request
					path: `https://public-api.wordpress.com/wpcom/v2/sites/${ blogId }/jetpack-protected-connection`,
					body: {
						fix_type: fixType,
						error_code: errorDetails.code,
						error_data: errorDetails.data,
					},
				} )
				.then( () => {
					setIsFixing( false );
					setFixSuccess( true );

					// Track the successful fix
					recordEvent( 'jetpack_my_jetpack_protected_owner_fix_success', {
						fix_type: fixType,
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
					recordEvent( 'jetpack_my_jetpack_protected_owner_fix_error', {
						fix_type: fixType,
						error_code: errorDetails.code,
						error_message: error.message,
					} );
				} );
		},
		[ recordEvent, getConnectionError ]
	);

	// Handle click on "Create Missing User Account" button for self-healing
	const handleCreateMissingUser = useCallback( () => {
		// Track the attempt to fix the self-heal error
		recordEvent( 'jetpack_my_jetpack_protected_owner_self_heal_attempt', {} );

		// Navigate to the WordPress Add New User admin page
		const initialState = window?.Initial_State as { adminUrl?: string } | undefined;
		window.location.href = ( initialState?.adminUrl || '/wp-admin/' ) + 'user-new.php';
	}, [ recordEvent ] );

	useEffect( () => {
		// Manual check for protected owner errors
		let foundProtectedOwnerError = false;
		try {
			if ( connectionErrors && typeof connectionErrors === 'object' ) {
				for ( const errorType in connectionErrors ) {
					const userErrors = connectionErrors[ errorType ];
					if ( userErrors && typeof userErrors === 'object' ) {
						for ( const userId in userErrors ) {
							const error = userErrors[ userId ];
							if ( error && error.error_type === 'protected_owner' ) {
								foundProtectedOwnerError = true;
								// Update state if needed
								if ( ! hasProtectedOwnerError ) {
									setHasProtectedOwnerError( true );
								}
								break;
							}
						}
					}
					if ( foundProtectedOwnerError ) break;
				}
			}
		} catch {
			// Ignore errors in our debug code
		}

		// Check for errors - use hasConnectionError OR our own detection of protected owner errors
		if ( ! hasConnectionError && ! hasProtectedOwnerError && ! foundProtectedOwnerError ) {
			return;
		}

		// Get connection error details to determine error type
		const connectionError = getConnectionError();

		if ( ! connectionError ) {
			return;
		}

		const errorAction = connectionError?.action;

		// Check if this is a protected owner error and get appropriate message
		let errorMessage;
		if ( connectionError.code && connectionError.error_type === 'protected_owner' ) {
			// Dynamically generate the message based on the error code
			errorMessage = getProtectedOwnerErrorMessage( connectionError.code );
		} else {
			// For regular errors, use the existing message
			errorMessage = connectionErrorMessage || connectionError.message;
		}

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
			const actionText =
				fixingType === 'once'
					? __( 'Fixing connection (once)…', 'jetpack-my-jetpack' )
					: __( 'Fixing connection (always)…', 'jetpack-my-jetpack' );

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
						onClick: () => handleProtectedOwnerFix( 'once' ),
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
				message: __( 'Connection fixed successfully! Refreshing…', 'jetpack-my-jetpack' ),
				options: noticeOptions,
			} );
			return;
		}

		// Generate different actions based on the error type
		let noticeActions: NoticeAction[] = [];

		// Check for protected owner error types and set appropriate actions
		if ( errorAction === 'self_heal_action' ) {
			// Self-healing error - add "Create Missing User Account" button
			noticeActions = [
				{
					label: __( 'Create Missing User Account', 'jetpack-my-jetpack' ),
					onClick: handleCreateMissingUser,
					noDefaultClasses: true,
				},
			];
		} else if ( errorAction === 'protected_owner_action' ) {
			// Protected owner mismatch error - add "Fix Once" and "Fix Always" buttons
			noticeActions = [
				{
					label: __( 'Fix Once', 'jetpack-my-jetpack' ),
					onClick: () => handleProtectedOwnerFix( 'once' ),
					noDefaultClasses: true,
					variant: 'secondary',
				},
				{
					label: __( 'Fix Always', 'jetpack-my-jetpack' ),
					onClick: () => handleProtectedOwnerFix( 'permanent' ),
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
		hasProtectedOwnerError,
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
		handleCreateMissingUser,
		getConnectionError,
		connectionErrors,
	] );
};

export default useConnectionErrorsNotice;
