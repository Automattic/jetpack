import { Col, Text } from '@automattic/jetpack-components';
import { useConnectionErrorNotice, useRestoreConnection } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import { useContext, useEffect, useCallback } from 'react';
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

	// Extract the connection error details from the connection data
	const getConnectionError = useCallback( () => {
		// Get errors from window.Initial_State
		// @ts-expect-error - Property 'connectionErrors' might not exist on type
		const myJetpackErrors = window?.Initial_State?.connectionErrors || [];

		if ( Array.isArray( myJetpackErrors ) && myJetpackErrors.length > 0 ) {
			const firstError = myJetpackErrors[ 0 ];

			const result = {
				message: firstError.message,
				code: firstError.data?.api_error_code || firstError.code,
				action: firstError.action,
				data: firstError.data || {},
				error_type: firstError.error_type || 'connection',
			} as ConnectionError;

			return result;
		}

		// FALLBACK: If connectionErrorMessage contains protected owner error but no errors array exists
		if (
			connectionErrorMessage &&
			( connectionErrorMessage.includes( 'plan owner' ) ||
				connectionErrorMessage.includes( 'WordPress.com plan owner' ) )
		) {
			// Extract email from the error message if possible
			const emailMatch = connectionErrorMessage.match( /email\s+([^\s]+@[^\s]+)/ );
			const wpcomEmail = emailMatch ? emailMatch[ 1 ] : 'unknown@wordpress.com';

			return {
				message: connectionErrorMessage,
				code: 'protected_owner_wrong_owner_protected_owner_missing',
				action: 'protected_owner_action',
				data: {
					wpcom_email: wpcomEmail,
					error_type: 'missing_owner',
				},
				error_type: 'protected_owner',
			} as ConnectionError;
		}

		return null;
	}, [ connectionErrorMessage ] );

	// Add a new handler for redirecting to create new user page
	const handleCreateMissingAccount = useCallback( () => {
		// Track the attempt to use create missing account
		recordEvent( 'jetpack_my_jetpack_protected_owner_create_account_attempt', {} );

		// Navigate to the WordPress Add New User admin page
		const initialState = window?.Initial_State as { adminUrl?: string } | undefined;
		window.location.href = ( initialState?.adminUrl || '/wp-admin/' ) + 'user-new.php';
	}, [ recordEvent ] );

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

		// Add additional check for protected owner errors in the error code
		const isProtectedOwnerErrorByCode = connectionError?.code?.includes( 'protected_owner' );

		// Check if we should treat this as a protected owner error
		const shouldTreatAsProtectedOwnerError = isProtectedOwnerError || isProtectedOwnerErrorByCode;

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

		// Add action buttons based on error type
		let noticeActions: NoticeAction[] = [];
		if ( shouldTreatAsProtectedOwnerError ) {
			// Protected owner mismatch error - add only "Create missing account" button
			noticeActions = [
				{
					label: __( 'Create missing account', 'jetpack-my-jetpack' ),
					onClick: handleCreateMissingAccount,
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
		handleCreateMissingAccount,
		getConnectionError,
	] );
};

export default useConnectionErrorsNotice;
