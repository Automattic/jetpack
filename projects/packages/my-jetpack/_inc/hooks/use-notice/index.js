/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';
import useMyJetpackConnection from '../use-my-jetpack-connection';

/**
 * React custom hook to get global notices.
 *
 * @returns {object} Global notices data
 */
export function useGlobalNotice() {
	const dispatch = useDispatch();

	const { message, options } = useSelect( select => select( STORE_ID ).getGlobalNotice() );
	return {
		message,
		options: options || {},
		clean: () => dispatch( STORE_ID ).cleanGlobalNotice(),
	};
}

/**
 * React custom hook to watch global events.
 * For instance, when the user is not connected,
 * the hook dispatches an action to populate the global notice.
 */
export default function useNoticeWatcher() {
	const dispatch = useDispatch();
	const { isUserConnected, redirectUrl } = useMyJetpackConnection();

	useEffect( () => {
		if ( ! isUserConnected ) {
			return dispatch( STORE_ID ).setGlobalNotice(
				__(
					'Jetpack is currently not connected and some products might not work until the connection is reestablished.',
					'jetpack-my-jetpack'
				),
				{
					status: 'error',
					actions: [
						{
							label: __( 'Connect Jetpack now.', 'jetpack-my-jetpack' ),
							url: redirectUrl,
						},
					],
				}
			);
		}
	}, [ isUserConnected, dispatch, redirectUrl ] );
}
