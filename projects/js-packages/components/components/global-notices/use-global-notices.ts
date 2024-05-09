import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

type NoticesStore = ReturnType< ( typeof noticesStore )[ 'instantiate' ] >;

export type TGlobalNotices = ReturnType< NoticesStore[ 'getActions' ] > &
	ReturnType< NoticesStore[ 'getSelectors' ] >;

/**
 * The global notices hook.
 *
 * @returns {TGlobalNotices} The global notices selectors and actions.
 */
export function useGlobalNotices(): TGlobalNotices {
	const actionCreators = useDispatch( noticesStore );
	const notices = useSelect( select => select( noticesStore ).getNotices(), [] );

	return {
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
		getNotices: () => notices,
	};
}
