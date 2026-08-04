import { Col, Text } from '@automattic/jetpack-components';
import {
	getReconnectErrorMessage,
	useConnectionErrorNotice,
	type ConnectionErrorObject,
} from '@automattic/jetpack-connection';
import { useContext, useEffect, useCallback, useMemo } from 'react';
import { NOTICE_PRIORITY_HIGH } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import useAnalytics from '../use-analytics';
import { assignLocation } from './assignLocation';
import {
	flattenConnectionErrors,
	getConnectionErrorDetailLines,
	getConnectionErrorTitle,
	groupConnectionErrorsByMessage,
} from './connection-error-details';
import type { ConnectionErrorViewer } from './connection-error-details';
import type { NoticeOptions, NoticeButtonAction } from '../../context/notices/types';

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
		connectionErrors,
		actions,
		isRestoringConnection,
		restoreConnectionError,
		connectionOwner,
		isCurrentUserConnectionOwner,
		currentUserId,
	} = useConnectionErrorNotice( {
		actionHandlers,
		trackingCallback,
		navigate: assignLocation,
		reconnectTrackingEvent: 'jetpack_my_jetpack_connection_error_notice_reconnect_cta_click',
	} );

	const ownerName = connectionOwner?.displayName;

	// Show every displayable error the backend handed us, not just the first.
	const errorList = useMemo( () => {
		const flattened = flattenConnectionErrors( connectionErrors );

		if ( flattened.length ) {
			return flattened;
		}

		return connectionError ? [ connectionError ] : [];
	}, [ connectionErrors, connectionError ] );

	useEffect( () => {
		if ( ! hasConnectionError || ! errorList.length ) {
			return;
		}

		// Who is looking, so an error's `audience` can be phrased from their point
		// of view.
		const viewer: ConnectionErrorViewer = {
			currentUserId,
			isOwner: isCurrentUserConnectionOwner,
			ownerName,
		};

		// Keep the backend message as the headline, then group broken-token errors under one
		// shared description with each error's scope and code.
		const errorMessage = (
			<Col>
				{ restoreConnectionError && (
					<Text mb={ 2 }>{ getReconnectErrorMessage( restoreConnectionError ) }</Text>
				) }
				{ groupConnectionErrorsByMessage( errorList ).map( group => {
					const detailLines = getConnectionErrorDetailLines( group.errors, viewer );

					return (
						<div key={ group.message }>
							<Text mb={ 1 }>{ group.message }</Text>
							{ detailLines.map( ( line, index ) => (
								<Text
									key={ line.key }
									variant="body-small"
									mb={ index === detailLines.length - 1 ? 2 : 1 }
								>
									{ line.text }
								</Text>
							) ) }
						</div>
					);
				} ) }
			</Col>
		);

		// `actions` is mapped over below, so a malformed value would throw inside the
		// effect and cost the user the error message along with the CTA.
		const baseActions = Array.isArray( actions ) ? actions : [];

		const noticeActions: NoticeButtonAction[] = baseActions.map( action => ( {
			...action,
			noDefaultClasses: true,
		} ) );

		const noticeOptions: NoticeOptions = {
			id: 'connection-error-notice',
			level: 'error',
			actions: noticeActions,
			priority: NOTICE_PRIORITY_HIGH + ( isRestoringConnection ? 1 : 0 ),
			tracksArgs: {
				error_count: errorList.length,
				error_code: errorList[ 0 ].error_code ?? null,
				audience: errorList[ 0 ].audience ?? 'site',
			},
		};

		setNotice( {
			message: errorMessage,
			title: getConnectionErrorTitle( errorList, viewer ),
			options: noticeOptions,
		} );
	}, [
		setNotice,
		hasConnectionError,
		errorList,
		currentUserId,
		isCurrentUserConnectionOwner,
		ownerName,
		actions,
		isRestoringConnection,
		restoreConnectionError,
	] );
};

export default useConnectionErrorsNotice;
