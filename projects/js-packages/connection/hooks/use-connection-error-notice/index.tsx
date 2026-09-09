import { useMemo } from 'react';
import ConnectionErrorNotice from '../../components/connection-error-notice';
import useConnection from '../../components/use-connection';
import useRestoreConnection from '../../hooks/use-restore-connection';
import { getConnectionErrorDetails, isConnectionErrorMap } from './error-details';
import { resolveConnectionErrorActions } from './resolve-actions';
import type {
	ConnectionErrorMap,
	ConnectionErrorObject,
	ConnectionErrorProps,
	ConnectionErrorViewer,
	UseConnectionErrorNoticeResult,
} from './types';
import type { ReactElement } from 'react';

export type {
	ConnectionErrorAudience,
	ConnectionErrorData,
	ConnectionErrorMap,
	ConnectionErrorObject,
} from './types';

/**
 * Default for the optional `actionHandlers` option.
 *
 * Hoisted rather than written as a `= {}` default, which would be a new object
 * on every render and so invalidate the `actions` memo below for every caller
 * that supplies no handlers of its own.
 */
const NO_ACTION_HANDLERS: NonNullable< ConnectionErrorProps[ 'actionHandlers' ] > = {};

/**
 * Connection error notice hook.
 *
 * The single source of truth for user-facing connection errors. It surfaces
 * real WPCOM-reported errors from the store (`connectionErrors`) and resolves
 * them into ready-to-render `actions`, so consumers render resolved CTAs
 * instead of re-deriving copy/handlers themselves. Pass the same options
 * accepted by `<ConnectionError />` to customize action handlers, tracking and
 * navigation.
 *
 * @param {ConnectionErrorProps} options - Action resolution options.
 * @return {UseConnectionErrorNoticeResult} - The hook data, including resolved `actions`.
 */
export default function useConnectionErrorNotice( {
	actionHandlers = NO_ACTION_HANDLERS,
	trackingCallback = null,
	customActions = null,
	reconnectTrackingEvent,
	navigate,
	includeHealthErrors = false,
}: ConnectionErrorProps = {} ): UseConnectionErrorNoticeResult {
	const { connectionErrors, connectionHealthErrors, connectionOwner, userConnectionData } =
		useConnection( {} );
	const { restoreConnection, isRestoringConnection, restoreConnectionError } =
		useRestoreConnection();

	// Everything below is derived from the store and handed to consumers that key
	// effects and memos off it (My Jetpack re-sets its notice whenever these
	// change identity), so each derivation is memoized: a fresh array or object
	// every render would re-fire that work on renders where nothing moved.
	const errorMap: ConnectionErrorMap = useMemo( () => {
		// connectionErrors is typed as Array<string|object> but is actually a nested
		// object at runtime; the store selector can also fall back to `[]`. Normalize
		// to a map so the returned value is honest to the ConnectionErrorMap contract.
		const storedErrorMap: ConnectionErrorMap = isConnectionErrorMap( connectionErrors )
			? connectionErrors
			: {};
		// `connectionHealthErrors` is typed as a `ConnectionErrorMap` at the store
		// boundary (selector defaults to `{}`, never an array), so no normalization
		// is needed — just guard against a caller that never populated the slot.
		// Only consumers that opted in (i.e. actually ran the probe) inherit it; for
		// everyone else the shared health slot is invisible.
		const healthErrorMap: ConnectionErrorMap = includeHealthErrors
			? connectionHealthErrors ?? {}
			: {};

		// Precedence: real WPCOM-reported store errors win; health-check failures are
		// the fallback so a broken connection still surfaces when the store is empty.
		return Object.keys( storedErrorMap ).length ? storedErrorMap : healthErrorMap;
	}, [ connectionErrors, connectionHealthErrors, includeHealthErrors ] );

	const currentUserId = userConnectionData?.currentUser?.id;

	// Not `currentUser.isMaster`: that goes false for the owner themselves once
	// their token breaks, which is exactly when this runs.
	const isCurrentUserConnectionOwner = Boolean(
		connectionOwner && connectionOwner.id === currentUserId
	);

	// Gated on `jetpack_connect` server-side, so this is absent for viewers who are
	// not allowed to know who the owner is.
	const ownerName = connectionOwner?.displayName;

	const viewer: ConnectionErrorViewer = useMemo(
		() => ( {
			currentUserId,
			isOwner: isCurrentUserConnectionOwner,
			ownerName,
		} ),
		[ currentUserId, isCurrentUserConnectionOwner, ownerName ]
	);

	// Everything a notice needs to describe these errors — title, message groups
	// with their scope lines, and the links to offer beneath them. Derived here so
	// every consumer presents the same errors the same way; see `error-details`.
	const {
		errors: displayableErrors,
		title: errorTitle,
		groups: errorGroups,
		showSupportLink,
	} = useMemo( () => getConnectionErrorDetails( errorMap, viewer ), [ errorMap, viewer ] );

	const actionError: ConnectionErrorObject | undefined = useMemo( () => {
		// The CTA comes from an error the viewer can actually resolve, and one they
		// can see. `displayableErrors` has already dropped the message-less errors and
		// the ones belonging to other users (see `isOtherUsersConnectionError`), in
		// store order, so the only condition left to apply here is the action itself.
		const resolvable = displayableErrors.find( error => error.error_data?.action !== 'none' );

		if ( resolvable ) {
			return resolvable;
		}

		// Nothing actionable, but something is still on screen: describe the first
		// error the viewer was actually shown, so the message and the CTA suppression
		// derived from it match the notice around them.
		if ( displayableErrors.length ) {
			return displayableErrors[ 0 ];
		}

		// Nothing displayable either, so no notice is rendered (`hasConnectionError`
		// is false below). Fall back to the first error in the map, filtered or not,
		// so `connectionError` still describes something to a caller reading it for
		// the error's type rather than for a CTA.
		const connectionErrorList = Object.values( errorMap ).shift();

		return connectionErrorList ? Object.values( connectionErrorList ).shift() : undefined;
	}, [ displayableErrors, errorMap ] );

	// Message and CTA describe the same error.
	const connectionErrorMessage = actionError?.error_message;

	// Whether there is a notice at all is the displayable set's to answer, not
	// `actionError`'s: its last-resort fallback reaches into the unfiltered map, so
	// keying off it would report an error the viewer is never shown. Consumers gate
	// their own notice chrome on this flag and would wrap an empty notice in it,
	// and `<ConnectionError />` below would fall back to rendering that error's
	// message — the filtering undone by the flag that was meant to respect it.
	const hasConnectionError = displayableErrors.length > 0;

	const actions = useMemo(
		() =>
			actionError
				? resolveConnectionErrorActions( actionError, {
						actionHandlers,
						trackingCallback,
						customActions,
						restoreConnection,
						isRestoringConnection,
						reconnectTrackingEvent,
						navigate,
				  } )
				: [],
		[
			actionError,
			actionHandlers,
			trackingCallback,
			customActions,
			restoreConnection,
			isRestoringConnection,
			reconnectTrackingEvent,
			navigate,
		]
	);

	return {
		hasConnectionError,
		connectionErrorMessage,
		connectionError: actionError, // Full error object with error_type, etc.
		connectionErrors: errorMap, // All errors for advanced use cases.
		displayableErrors,
		errorTitle,
		errorGroups,
		showSupportLink,
		viewer,
		actions, // Resolved CTA actions for the connection error.
		restoreConnection,
		isRestoringConnection,
		restoreConnectionError,
		connectionOwner,
		isCurrentUserConnectionOwner,
		currentUserId,
	};
}

/**
 * The package's ready-made connection error notice: the hook wired to the
 * presentational component.
 *
 * @param {ConnectionErrorProps} props - Action resolution options, plus an optional `context` line.
 * @return {ReactElement | null} The notice, or null when there is no error to show.
 */
export function ConnectionError( {
	context,
	...props
}: ConnectionErrorProps = {} ): ReactElement | null {
	const {
		hasConnectionError,
		connectionErrorMessage,
		connectionError,
		errorTitle,
		errorGroups,
		showSupportLink,
		actions,
		restoreConnection,
		isRestoringConnection,
		restoreConnectionError,
	} = useConnectionErrorNotice( props );

	if ( ! hasConnectionError ) {
		return null;
	}

	// An explicit 'none' action marks the error as informational only, so the
	// default "Restore Connection" fallback must not be shown either.
	const suppressRestoreFallback = connectionError?.error_data?.action === 'none';

	return (
		<ConnectionErrorNotice
			isRestoringConnection={ isRestoringConnection }
			restoreConnectionError={ restoreConnectionError }
			restoreConnectionCallback={
				actions.length === 0 && ! suppressRestoreFallback ? restoreConnection : null
			}
			message={ connectionErrorMessage }
			errorGroups={ errorGroups }
			showSupportLink={ showSupportLink }
			// A feature-supplied context line is more specific than the shared title,
			// so it wins the one slot the notice has for it.
			context={ context ?? errorTitle }
			actions={ actions }
		/>
	);
}
