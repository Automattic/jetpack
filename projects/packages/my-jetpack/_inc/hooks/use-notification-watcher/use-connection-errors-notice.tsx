import { Col, Text } from '@automattic/jetpack-components';
import {
	ConnectionErrorSupportLink,
	formatConnectionErrorDetailLine,
	getReconnectErrorMessage,
	useConnectionErrorNotice,
	type ConnectionErrorNoticeLink,
	type ConnectionErrorObject,
} from '@automattic/jetpack-connection';
import { Link } from '@wordpress/ui';
import { useContext, useEffect, useCallback, useMemo } from 'react';
import { NOTICE_PRIORITY_HIGH } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import useConnectionErrorTracking from '../use-connection-error-tracking';
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

/**
 * One notice-body link with its click handler bound to the link, so the list
 * passes a stable reference instead of a per-item arrow (`react/jsx-no-bind`).
 *
 * @param {object}                    props         - Component props.
 * @param {ConnectionErrorNoticeLink} props.link    - The link to render.
 * @param {Function}                  props.onClick - Optional click handler.
 * @return {React.ReactElement} The rendered link.
 */
const NoticeLink = ( {
	link,
	onClick,
}: {
	link: ConnectionErrorNoticeLink;
	// Optional so that during a Jetpack update, an older shared jetpack-connection
	// copy whose hook predates `trackNoticeLinkClick` degrades to no tracking
	// rather than a TypeError on click.
	onClick?: ( link: ConnectionErrorNoticeLink ) => void;
} ) => {
	const handleClick = useCallback( () => onClick?.( link ), [ link, onClick ] );

	return (
		<Text mt={ 1 }>
			<Link href={ link.url } onClick={ handleClick } children={ link.label } />
		</Text>
	);
};

const useConnectionErrorsNotice = (
	actionHandlers: Record< string, ( error: ConnectionErrorObject ) => void > = NO_ACTION_HANDLERS
) => {
	const { setNotice } = useContext( NoticeContext );
	const trackingCallback = useConnectionErrorTracking();

	// Detection, copy and action resolution are owned by the connection package;
	// we only map what it derived into a My Jetpack notice and re-attach our own
	// tracking event for the reconnect CTA.
	const {
		hasConnectionError,
		severity,
		connectionError,
		displayableErrors,
		errorTitle,
		errorGroups,
		showSupportLink,
		actions,
		trackNoticeLinkClick,
		trackSupportLinkClick,
		isRestoringConnection,
		restoreConnectionError,
	} = useConnectionErrorNotice( {
		actionHandlers,
		trackingCallback,
		trackingContext: 'my-jetpack',
		navigate: assignLocation,
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

		// A hand-built copy of the package's `ConnectionErrorDetails`, kept until My Jetpack
		// renders the package's `<ConnectionError />` directly. Don't extend it.
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
							<NoticeLink key={ link.url } link={ link } onClick={ trackNoticeLinkClick } />
						) ) }
					</div>
				) ) }
				{ showSupportLink && (
					// The copy and the destination are the connection package's, shared with
					// its own notice so a translator sees one string and the two cannot drift.
					<Text mt={ 1 }>
						<ConnectionErrorSupportLink onClick={ trackSupportLinkClick } />
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
			// The package rates the break for this viewer; a broken owner token is a
			// warning to everybody but the owner, who is the only one who can fix it.
			level: severity ?? 'error',
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
		severity,
		tracksArgs,
		errorGroups,
		errorTitle,
		showSupportLink,
		actions,
		trackNoticeLinkClick,
		trackSupportLinkClick,
		isRestoringConnection,
		restoreConnectionError,
	] );
};

export default useConnectionErrorsNotice;
