import { Col, Text } from '@automattic/jetpack-components';
import {
	ConnectionErrorSupportLink,
	formatConnectionErrorDetailLine,
	getReconnectErrorMessage,
	useConnectionErrorNotice,
	type ConnectionErrorObject,
} from '@automattic/jetpack-connection';
import { Link } from '@wordpress/ui';
import { useContext, useEffect, useCallback, useMemo } from 'react';
import { NOTICE_PRIORITY_HIGH } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import useAnalytics from '../use-analytics';
import { assignLocation } from './assignLocation';
import type { NoticeOptions, NoticeButtonAction } from '../../context/notices/types';

/**
 * Default for the optional `actionHandlers` argument.
 *
 * A `= {}` default would hand the connection package a new object on every
 * render, and it memoizes the resolved CTA actions on that identity — which
 * would then rebuild every render and re-fire the effect below.
 */
const NO_ACTION_HANDLERS: Record< string, ( error: ConnectionErrorObject ) => void > = {};

const useConnectionErrorsNotice = (
	actionHandlers: Record< string, ( error: ConnectionErrorObject ) => void > = NO_ACTION_HANDLERS
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

	// Detection, copy and action resolution are owned by the connection package;
	// we only map what it derived into a My Jetpack notice and re-attach our own
	// tracking event for the reconnect CTA.
	const {
		hasConnectionError,
		connectionError,
		displayableErrors,
		errorTitle,
		errorGroups,
		showSupportLink,
		actions,
		isRestoringConnection,
		restoreConnectionError,
	} = useConnectionErrorNotice( {
		actionHandlers,
		trackingCallback,
		navigate: assignLocation,
		reconnectTrackingEvent: 'jetpack_my_jetpack_connection_error_notice_reconnect_cta_click',
	} );

	// Report the error the CTA belongs to rather than whichever came first in the
	// map — unless that error is one the package filtered out, in which case
	// reporting it would describe something the viewer was never shown. Matched by
	// error code + user ID (the store's own keying) rather than object identity,
	// since `displayableErrors` isn't guaranteed to hold the same references
	// `connectionError` came from.
	const trackedErrorKey = `${ connectionError?.error_code }:${ connectionError?.user_id ?? '' }`;
	const trackedError =
		connectionError &&
		displayableErrors.some(
			error => `${ error.error_code }:${ error.user_id ?? '' }` === trackedErrorKey
		)
			? connectionError
			: displayableErrors[ 0 ];

	// `GlobalNotice` fires its view event from an effect that depends on
	// `tracksArgs` by identity, so a fresh literal on every `setNotice` would
	// report a second view of the same notice. The notice is re-set at a higher
	// priority when a reconnect starts, which is exactly that case — so hold one
	// object and rebuild it only when what it reports actually changes. The deps
	// are all primitives on purpose: `trackedError` gets a new identity whenever
	// the store re-emits, and that churn must not reach this object.
	const tracksArgs = useMemo(
		() => ( {
			error_count: displayableErrors.length,
			// The payload comes from the server, so the declared type is a promise the
			// data cannot keep. Report a code only when it really is one, rather than
			// sending Tracks whatever arrived.
			error_code: typeof trackedError?.error_code === 'string' ? trackedError.error_code : null,
			audience: trackedError?.audience ?? 'site',
		} ),
		[ displayableErrors.length, trackedError?.error_code, trackedError?.audience ]
	);

	useEffect( () => {
		if ( ! hasConnectionError || ! errorGroups.length ) {
			return;
		}

		// Keep the backend message as the headline, then group broken-token errors under one
		// shared description with each error's scope beneath it. Both the grouping and the
		// scope lines come from the connection package.
		const errorMessage = (
			<Col>
				{ restoreConnectionError && (
					<Text mb={ 2 }>{ getReconnectErrorMessage( restoreConnectionError ) }</Text>
				) }
				{ errorGroups.map( ( group, groupIndex ) => (
					<div key={ group.message }>
						<Text mt={ groupIndex > 0 ? 2 : 0 } mb={ group.detailLines.length ? 1 : 0 }>
							{ group.message }
						</Text>
						{ group.detailLines.length > 0 && (
							// A real list, so assistive tech announces how many scopes an error
							// covers instead of reading loose lines. `Text` supplies the margin
							// and padding reset; only the marker has to be turned off by hand,
							// and one declaration does not earn a stylesheet of its own.
							<Text component="ul" style={ { listStyle: 'none' } }>
								{ group.detailLines.map( ( line, index ) => (
									<Text
										component="li"
										key={ line.key }
										variant="body-small"
										mb={ index === group.detailLines.length - 1 ? 0 : 1 }
									>
										{ formatConnectionErrorDetailLine( line ) }
									</Text>
								) ) }
							</Text>
						) }
						{ group.noticeLinks.map( link => (
							<Text key={ link.url } mt={ 1 }>
								<Link href={ link.url } children={ link.label } />
							</Text>
						) ) }
					</div>
				) ) }
				{ showSupportLink && (
					// The copy and the destination are the connection package's, shared with
					// its own notice so a translator sees one string and the two cannot drift.
					<Text mt={ 1 }>
						<ConnectionErrorSupportLink />
					</Text>
				) }
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
			title: errorTitle,
			options: noticeOptions,
		} );
	}, [
		setNotice,
		hasConnectionError,
		tracksArgs,
		errorGroups,
		errorTitle,
		showSupportLink,
		actions,
		isRestoringConnection,
		restoreConnectionError,
	] );
};

export default useConnectionErrorsNotice;
