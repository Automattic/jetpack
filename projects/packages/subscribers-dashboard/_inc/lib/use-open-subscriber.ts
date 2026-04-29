import { useCallback, useEffect, useState } from '@wordpress/element';

const URL_KEY_SUBSCRIPTION = 'subscriber';
const URL_KEY_USER = 'u';

export type OpenSubscriber = {
	subscriptionId?: number;
	userId?: number;
} | null;

/**
 * Read the open-subscriber identifiers off the current URL search params.
 *
 * @return Open-subscriber descriptor or null when no relevant params are present.
 */
function readFromUrl(): OpenSubscriber {
	if ( typeof window === 'undefined' ) {
		return null;
	}
	const params = new URLSearchParams( window.location.search );
	const subscriptionId = Number( params.get( URL_KEY_SUBSCRIPTION ) );
	const userId = Number( params.get( URL_KEY_USER ) );
	const hasSubscription = Number.isFinite( subscriptionId ) && subscriptionId > 0;
	const hasUser = Number.isFinite( userId ) && userId > 0;

	if ( ! hasSubscription && ! hasUser ) {
		return null;
	}

	return {
		subscriptionId: hasSubscription ? subscriptionId : undefined,
		userId: hasUser ? userId : undefined,
	};
}

/**
 * Mirror the open-subscriber descriptor back to the URL via `history.replaceState`, preserving
 * any unrelated search params (filters, sort, paging, wp-admin's own `page=subscribers`).
 *
 * @param open - Current open-subscriber descriptor (null clears the params).
 */
function writeToUrl( open: OpenSubscriber ): void {
	if ( typeof window === 'undefined' ) {
		return;
	}
	const params = new URLSearchParams( window.location.search );

	if ( open?.subscriptionId ) {
		params.set( URL_KEY_SUBSCRIPTION, String( open.subscriptionId ) );
	} else {
		params.delete( URL_KEY_SUBSCRIPTION );
	}

	if ( open?.userId ) {
		params.set( URL_KEY_USER, String( open.userId ) );
	} else {
		params.delete( URL_KEY_USER );
	}

	const queryString = params.toString();
	const newUrl = `${ window.location.pathname }${ queryString ? `?${ queryString }` : '' }`;
	window.history.replaceState( window.history.state, '', newUrl );
}

/**
 * URL-synced "currently open subscriber" state. Reads `?subscriber=<id>&u=<user_id>` on mount and
 * mirrors changes back to the URL via `history.replaceState`, so detail-panel views are
 * deep-linkable and survive reload.
 *
 * @return Tuple of `[openSubscriber, setOpenSubscriber]`.
 */
export function useOpenSubscriber(): [ OpenSubscriber, ( next: OpenSubscriber ) => void ] {
	const [ open, setOpen ] = useState< OpenSubscriber >( () => readFromUrl() );

	useEffect( () => {
		writeToUrl( open );
	}, [ open ] );

	const setOpenSubscriber = useCallback( ( next: OpenSubscriber ) => {
		setOpen( next );
	}, [] );

	return [ open, setOpenSubscriber ];
}
