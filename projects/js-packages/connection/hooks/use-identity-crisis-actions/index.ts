import restApi from '@automattic/jetpack-api';
import { dispatch } from '@wordpress/data';
import { useCallback, useRef, useState } from 'react';
import {
	CONNECTION_EVENTS,
	toBlogId,
	trackIdentityCrisisEvent,
} from '../../helpers/connection-tracking';
import { isHttpUrl } from '../../helpers/is-http-url';
import STORE_ID from '../../state/store-id';
import { getIdentityCrisisErrorCause, getIdentityCrisisErrorCode } from './get-error-cause';
import type {
	IdentityCrisisAction,
	IdentityCrisisActionPath,
	IdentityCrisisActions,
	IdentityCrisisError,
	UseIdentityCrisisActionsOptions,
} from './types';
import type { ConnectionEvent, TrackingProps } from '../../helpers/connection-tracking';

/** Each action's `action` value in the events, and the old screen's event for its start. */
const ACTION_EVENTS: Record<
	IdentityCrisisAction,
	{ action: 'migrate' | 'start_fresh' | 'confirm_safe_mode'; start: ConnectionEvent }
> = {
	migrate: { action: 'migrate', start: CONNECTION_EVENTS.idcMigrate },
	'start-fresh': { action: 'start_fresh', start: CONNECTION_EVENTS.idcStartFresh },
	'confirm-safe-mode': { action: 'confirm_safe_mode', start: CONNECTION_EVENTS.idcConfirmSafeMode },
};

/**
 * The `error_code` to record, so only a plain id reaches Tracks.
 *
 * @param code - The hook's `error.code`.
 * @return The code, `unknown` without one, or `other` when it isn't a plain id.
 */
function getEventErrorCode( code: string | undefined ): string {
	if ( ! code ) {
		return 'unknown';
	}
	return /^[A-Za-z0-9_-]{1,64}$/.test( code ) ? code : 'other';
}

/**
 * The three Safe Mode resolutions and their Tracks events, without navigation: the host decides what follows.
 *
 * Requests go through `@automattic/jetpack-api`, whose root and nonce the connection store sets.
 *
 * @param options                   - Hook options.
 * @param options.redirectUri       - Admin path to return to after a fresh connection.
 * @param options.from              - Name from `CONNECTION_FROM`, reported to WordPress.com with a fresh connection.
 * @param options.context           - The screen's `context` prop, for the events.
 * @param options.isDevelopmentSite - From the Safe Mode state, for the events.
 * @return The actions and their state.
 */
export default function useIdentityCrisisActions( {
	redirectUri,
	from,
	context,
	isDevelopmentSite,
}: UseIdentityCrisisActionsOptions = {} ): IdentityCrisisActions {
	const [ busyAction, setBusyAction ] = useState< IdentityCrisisAction | null >( null );
	const [ error, setError ] = useState< IdentityCrisisError | null >( null );
	const [ isMigrated, setIsMigrated ] = useState( false );
	const [ isDisconnected, setIsDisconnected ] = useState( false );
	const [ isResolved, setIsResolved ] = useState( false );
	// State updates on the next render, so a second call in the same tick would still see it unset.
	const busyRef = useRef< IdentityCrisisAction | null >( null );

	const setBusy = useCallback( ( action: IdentityCrisisAction | null ) => {
		busyRef.current = action;
		setBusyAction( action );
	}, [] );

	const run = useCallback(
		async < T >(
			action: IdentityCrisisAction,
			request: () => Promise< T >,
			actionPath: IdentityCrisisActionPath | undefined,
			getSuccessProps?: ( response: T ) => TrackingProps
		): Promise< { response: T } | null > => {
			if ( busyRef.current ) {
				return null;
			}
			setBusy( action );
			setError( null );
			const events = ACTION_EVENTS[ action ];
			// A host that passes an action straight to `onClick` hands it the click event instead.
			const path = typeof actionPath?.path === 'string' ? actionPath.path : undefined;
			const props = { path, is_development_site: isDevelopmentSite };
			trackIdentityCrisisEvent( events.start, context, props );

			let response: T;
			try {
				response = await request();
			} catch ( caught ) {
				const cause = getIdentityCrisisErrorCause( caught );
				// Optional: an older copy of the store, or none, may be registered.
				const store = dispatch( STORE_ID ) as
					| { setIdentityCrisisDisconnected?: () => void; setIdentityCrisisResolved?: () => void }
					| undefined;
				if ( cause === 'disconnected' ) {
					setIsDisconnected( true );
					store?.setIdentityCrisisDisconnected?.();
				} else if ( cause === 'resolved' ) {
					setIsResolved( true );
					store?.setIdentityCrisisResolved?.();
				}
				const code = getIdentityCrisisErrorCode( caught );
				setError( { action, cause, code } );
				setBusy( null );
				trackIdentityCrisisEvent( CONNECTION_EVENTS.idcActionError, context, {
					action: events.action,
					...props,
					error_code: getEventErrorCode( code ),
					error_cause: cause,
				} );
				return null;
			}
			// Beaconed, because the host may reload or leave as soon as the action resolves.
			trackIdentityCrisisEvent( CONNECTION_EVENTS.idcActionSuccess, context, {
				action: events.action,
				...props,
				use_beacon: true,
				...getSuccessProps?.( response ),
			} );
			return { response };
		},
		[ setBusy, context, isDevelopmentSite ]
	);

	const migrate: IdentityCrisisActions[ 'migrate' ] = useCallback(
		async ( actionPath?: IdentityCrisisActionPath ) => {
			const result = await run( 'migrate', () => restApi.migrateIDC(), actionPath );
			if ( ! result ) {
				return false;
			}
			setBusy( null );
			setIsMigrated( true );
			return true;
		},
		[ run, setBusy ]
	);

	const startFresh: IdentityCrisisActions[ 'startFresh' ] = useCallback(
		async ( actionPath?: IdentityCrisisActionPath ) => {
			const result = await run(
				'start-fresh',
				async () => {
					const url: unknown = await restApi.startIDCFresh( redirectUri, from );
					// The host navigates to it, so anything but a web URL counts as a server failure.
					if ( ! isHttpUrl( url ) ) {
						const invalid = new Error( 'Start fresh returned no connect URL' );
						invalid.name = 'InvalidConnectUrl';
						throw invalid;
					}
					return url;
				},
				actionPath,
				// The site re-registered, so the connect URL's `client_id` is its new blog id.
				url => ( { new_blog_id: toBlogId( new URL( url ).searchParams.get( 'client_id' ) ) } )
			);
			return result ? result.response : null;
		},
		[ run, redirectUri, from ]
	);

	const confirmSafeMode: IdentityCrisisActions[ 'confirmSafeMode' ] = useCallback(
		async ( actionPath?: IdentityCrisisActionPath ) => {
			const result = await run(
				'confirm-safe-mode',
				() => restApi.confirmIDCSafeMode(),
				actionPath
			);
			return Boolean( result );
		},
		[ run ]
	);

	const clearError = useCallback( () => setError( null ), [] );

	return {
		migrate,
		startFresh,
		confirmSafeMode,
		clearError,
		busyAction,
		error,
		isMigrated,
		isDisconnected,
		isResolved,
	};
}
