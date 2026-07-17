import { Col, Text } from '@automattic/jetpack-components';
import {
	getReconnectErrorMessage,
	useConnectionErrorNotice,
	type ConnectionErrorObject,
} from '@automattic/jetpack-connection';
import { useContext, useEffect, useCallback } from 'react';
import { NOTICE_PRIORITY_HIGH } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import useAnalytics from '../use-analytics';
import { assignLocation } from './assignLocation';
import type { NoticeOptions, NoticeButtonAction } from '../../context/notices/types';
import type { ReactElement } from 'react';

const useConnectionErrorsNotice = (
	actionHandlers: Record< string, ( error: ConnectionErrorObject ) => void > = {}
) => {
	const { setNotice } = useContext( NoticeContext );
	const { recordEvent } = useAnalytics();

	// Tracking callback for the shared resolver, preserving My Jetpack's
	// "jetpack_"-prefixed event guard.
	const trackingCallback = useCallback(
		( event: string, data: object ) => {
			if ( event && event.startsWith( 'jetpack_' ) ) {
				recordEvent(
					event as `jetpack_${ string }`,
					data as Parameters< typeof recordEvent >[ 1 ]
				);
			}
		},
		[ recordEvent ]
	);

	// Action resolution and copy are owned by the connection package; we only
	// map the resolved actions into a My Jetpack notice and re-attach our own
	// tracking event for the reconnect CTA.
	const {
		hasConnectionError,
		connectionError,
		actions,
		isRestoringConnection,
		restoreConnectionError,
	} = useConnectionErrorNotice( {
		actionHandlers,
		trackingCallback,
		navigate: assignLocation,
		reconnectTrackingEvent: 'jetpack_my_jetpack_connection_error_notice_reconnect_cta_click',
	} );

	useEffect( () => {
		if ( ! hasConnectionError || ! connectionError ) {
			return;
		}

		// Use the error message provided by the owner hook.
		let errorMessage: string | ReactElement = connectionError.error_message;

		if ( restoreConnectionError ) {
			errorMessage = (
				<Col>
					<Text mb={ 2 }>{ getReconnectErrorMessage( restoreConnectionError ) }</Text>
					<Text mb={ 2 }>{ connectionError.error_message }</Text>
				</Col>
			);
		}

		// Guard against an older externalized connection package that predates
		// resolved `actions`.
		const baseActions = ( actions as typeof actions | undefined ) ?? [];

		const noticeActions: NoticeButtonAction[] = baseActions.map( action => ( {
			...action,
			noDefaultClasses: true,
		} ) );

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
		hasConnectionError,
		connectionError,
		actions,
		isRestoringConnection,
		restoreConnectionError,
	] );
};

export default useConnectionErrorsNotice;
