import { Col, Text } from '@automattic/jetpack-components';
import { useConnectionErrorNotice, useRestoreConnection } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import { useContext, useEffect, useCallback } from 'react';
import { NOTICE_PRIORITY_HIGH } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import useAnalytics from '../use-analytics';
import { assignLocation } from './assignLocation';
import type { NoticeOptions, NoticeButtonAction } from '../../context/notices/types';
import type { ReactElement } from 'react';

const useConnectionErrorsNotice = ( actionHandlers = {} ) => {
	const { setNotice } = useContext( NoticeContext );
	const { hasConnectionError, connectionError } = useConnectionErrorNotice();
	const { restoreConnection, isRestoringConnection, restoreConnectionError } =
		useRestoreConnection();
	const { recordEvent } = useAnalytics();

	// Generic handler for custom actions based on error data
	const handleCustomAction = useCallback(
		( actionUrl: string, trackingEvent?: string ) => {
			// Track the action if tracking event is provided and follows expected pattern
			if ( trackingEvent && trackingEvent.startsWith( 'jetpack_' ) ) {
				recordEvent( trackingEvent as `jetpack_${ string }`, {} );
			}

			// Navigate to the action URL
			assignLocation( actionUrl );
		},
		[ recordEvent ]
	);

	useEffect( () => {
		if ( ! hasConnectionError || ! connectionError ) {
			return;
		}

		// Use the error message provided by the backend
		let errorMessage: string | ReactElement = connectionError.error_message;

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

		// Build actions based on error data
		let noticeActions: NoticeButtonAction[] = [];

		// Get action info from error data
		const errorData = connectionError?.error_data || {};
		const suggestedAction = errorData.action;
		const actionHandler = actionHandlers[ suggestedAction ];
		const actionUrl = errorData.action_url;
		const actionLabel = errorData.action_label;
		const trackingEvent = errorData.tracking_event;

		if ( suggestedAction && actionHandler ) {
			// Custom action handler provided (function call)
			noticeActions = [
				{
					label: actionLabel || __( 'Take Action', 'jetpack-my-jetpack' ),
					onClick: () => {
						if ( trackingEvent && trackingEvent.startsWith( 'jetpack_' ) ) {
							recordEvent( trackingEvent as `jetpack_${ string }`, {} );
						}
						actionHandler( connectionError );
					},
					noDefaultClasses: true,
				},
			];
		} else if ( actionUrl && actionLabel ) {
			// Custom URL action provided (navigation)
			noticeActions = [
				{
					label: actionLabel,
					onClick: () => handleCustomAction( actionUrl, trackingEvent ),
					noDefaultClasses: true,
				},
			];
		} else {
			// Default action - restore connection
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
		handleCustomAction,
		actionHandlers,
	] );
};

export default useConnectionErrorsNotice;
