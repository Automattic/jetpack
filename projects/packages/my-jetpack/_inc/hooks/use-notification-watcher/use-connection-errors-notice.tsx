import { Col, Text } from '@automattic/jetpack-components';
import {
	useConnectionErrorNotice,
	useRestoreConnection,
	getProtectedOwnerCreateAccountUrl,
} from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import { useContext, useEffect, useCallback } from 'react';
import { NOTICE_PRIORITY_HIGH } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import useAnalytics from '../use-analytics';
import { assignLocation } from './assignLocation';
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

const useConnectionErrorsNotice = () => {
	const { setNotice } = useContext( NoticeContext );
	const { hasConnectionError, connectionError } = useConnectionErrorNotice(); // Using enhanced hook
	const { restoreConnection, isRestoringConnection, restoreConnectionError } =
		useRestoreConnection();
	const { recordEvent } = useAnalytics();

	// Handler for creating missing account (protected owner errors)
	const handleCreateMissingAccount = useCallback( () => {
		// Track the attempt to use create missing account
		recordEvent( 'jetpack_my_jetpack_protected_owner_create_account_attempt', {} );

		// Get admin URL and generate the complete URL with email prepopulation
		const initialState = window?.Initial_State as { adminUrl?: string } | undefined;
		const adminUrl = initialState?.adminUrl || '/wp-admin/';
		const redirectUrl = getProtectedOwnerCreateAccountUrl( connectionError, adminUrl );

		assignLocation( redirectUrl );
	}, [ recordEvent, connectionError ] );

	useEffect( () => {
		// Use the enhanced hook data - it now includes protected owner errors
		if ( ! hasConnectionError || ! connectionError ) {
			return;
		}

		// Check if this is a protected owner error based on the error_type field
		const isProtectedOwnerError = connectionError.error_type === 'protected_owner';

		// Use the error message provided by the backend
		let errorMessage: string | React.ReactElement = connectionError.error_message;

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
					<Text mb={ 2 }>{ connectionError.error_message }</Text>
				</Col>
			);
		}

		// Add action buttons based on error type
		let noticeActions: NoticeAction[] = [];
		if ( isProtectedOwnerError ) {
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
		connectionError,
		restoreConnection,
		isRestoringConnection,
		restoreConnectionError,
		handleCreateMissingAccount,
	] );
};

export default useConnectionErrorsNotice;
