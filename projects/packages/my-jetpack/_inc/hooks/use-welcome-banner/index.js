import { useDispatch, useSelect } from '@wordpress/data';
import { STORE_ID } from '../../state/store';

/**
 * React custom hook to handle the welcome banner state.
 *
 * @returns {object} recent stats counts data
 */
export default function useWelcomeBanner() {
	const { dismissWelcomeBanner } = useDispatch( STORE_ID );
	const { hasBeenDismissed } = useSelect( select => {
		const { getWelcomeBannerHasBeen } = select( STORE_ID );

		return {
			hasBeenDismissed: getWelcomeBannerHasBeen(),
		};
	} );

	return {
		hasBeenDismissed,
		dismissWelcomeBanner,
	};
}
