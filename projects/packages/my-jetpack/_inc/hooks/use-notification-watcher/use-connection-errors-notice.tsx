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
	excludeOtherUsersErrors,
	flattenConnectionErrors,
	getConnectionErrorDetailLines,
	getConnectionErrorTitle,
	groupConnectionErrorsByMessage,
	titleIncludesScope,
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

	// Show every displayable error the backend handed us, not just the first —
	// minus the ones belonging to other users, which this viewer can neither fix
	// nor is affected by.
	const errorList = useMemo( () => {
		const viewer = { currentUserId };
		const flattened = excludeOtherUsersErrors(
			flattenConnectionErrors( connectionErrors ),
			viewer
		);

		if ( flattened.length ) {
			return flattened;
		}

		return connectionError ? excludeOtherUsersErrors( [ connectionError ], viewer ) : [];
	}, [ connectionErrors, connectionError, currentUserId ] );

	// Report the error the CTA belongs to rather than whichever came first in the
	// map — unless that error is one we filtered out, in which case reporting it
	// would describe something the viewer was never shown. Matched by error code
	// + user ID (the store's own keying) rather than object identity, since
	// `errorList` isn't guaranteed to hold the same references `connectionError`
	// came from.
	const trackedErrorKey = `${ connectionError?.error_code }:${ connectionError?.user_id ?? '' }`;
	const trackedError =
		connectionError &&
		errorList.some( error => `${ error.error_code }:${ error.user_id ?? '' }` === trackedErrorKey )
			? connectionError
			: errorList[ 0 ];

	// `GlobalNotice` fires its view event from an effect that depends on
	// `tracksArgs` by identity, so a fresh literal on every `setNotice` would
	// report a second view of the same notice. The notice is re-set at a higher
	// priority when a reconnect starts, which is exactly that case — so hold one
	// object and rebuild it only when what it reports actually changes. The deps
	// are all primitives on purpose: `trackedError` gets a new identity whenever
	// the store re-emits, and that churn must not reach this object.
	const tracksArgs = useMemo(
		() => ( {
			error_count: errorList.length,
			// The payload comes from the server, so the declared type is a promise the
			// data cannot keep. Report a code only when it really is one, rather than
			// sending Tracks whatever arrived.
			error_code: typeof trackedError?.error_code === 'string' ? trackedError.error_code : null,
			audience: trackedError?.audience ?? 'site',
		} ),
		[ errorList.length, trackedError?.error_code, trackedError?.audience ]
	);

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

		// A detail line only ever states the scope, so where the title already names
		// it there is nothing left to say and no line is rendered.
		const scopeIsInTitle = titleIncludesScope( errorList );

		// Keep the backend message as the headline, then group broken-token errors under one
		// shared description with each error's scope beneath it.
		const errorMessage = (
			<Col>
				{ restoreConnectionError && (
					<Text mb={ 2 }>{ getReconnectErrorMessage( restoreConnectionError ) }</Text>
				) }
				{ groupConnectionErrorsByMessage( errorList ).map( ( group, groupIndex ) => {
					const detailLines = scopeIsInTitle
						? []
						: getConnectionErrorDetailLines( group.errors, viewer );

					return (
						<div key={ group.message }>
							<Text mt={ groupIndex > 0 ? 2 : 0 } mb={ detailLines.length ? 1 : 0 }>
								{ group.message }
							</Text>
							{ detailLines.map( ( line, index ) => (
								<Text
									key={ line.key }
									variant="body-small"
									mb={ index === detailLines.length - 1 ? 0 : 1 }
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
			tracksArgs,
		};

		setNotice( {
			message: errorMessage,
			title: getConnectionErrorTitle( errorList, viewer ),
			options: noticeOptions,
		} );
	}, [
		setNotice,
		hasConnectionError,
		tracksArgs,
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
