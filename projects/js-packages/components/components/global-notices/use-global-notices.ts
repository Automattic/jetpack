import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { useMemo, useRef } from 'react';

type NoticesStore = ReturnType< ( typeof noticesStore )[ 'instantiate' ] >;

export type TGlobalNotices = ReturnType< NoticesStore[ 'getActions' ] > &
	ReturnType< NoticesStore[ 'getSelectors' ] >;

/**
 * The global notices hook.
 *
 * The returned object and every action creator on it are referentially
 * stable across renders. This matters: the hook subscribes to the notices
 * store, so creating a notice re-renders every consumer — if the creators
 * were fresh closures each render, any effect depending on one would re-run
 * during that (synchronous) store flush and could loop back into itself.
 *
 * @return {TGlobalNotices} The global notices selectors and actions.
 */
export function useGlobalNotices(): TGlobalNotices {
	const actionCreators = useDispatch( noticesStore );
	const notices = useSelect( select => select( noticesStore ).getNotices(), [] );

	// Latest notices behind a ref so `getNotices` can stay stable while
	// always returning fresh data.
	const noticesRef = useRef( notices );
	noticesRef.current = notices;

	return useMemo(
		() => ( {
			...actionCreators,
			createNotice( status, content, options ) {
				return actionCreators.createNotice( status, content, { type: 'snackbar', ...options } );
			},
			createErrorNotice( content, options ) {
				return actionCreators.createErrorNotice( content, { type: 'snackbar', ...options } );
			},
			createInfoNotice( content, options ) {
				return actionCreators.createInfoNotice( content, { type: 'snackbar', ...options } );
			},
			createSuccessNotice( content, options ) {
				return actionCreators.createSuccessNotice( content, { type: 'snackbar', ...options } );
			},
			createWarningNotice( content, options ) {
				return actionCreators.createWarningNotice( content, { type: 'snackbar', ...options } );
			},
			getNotices: () => noticesRef.current,
		} ),
		[ actionCreators ]
	);
}
