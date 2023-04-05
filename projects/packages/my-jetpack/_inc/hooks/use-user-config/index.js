import { useSelect } from '@wordpress/data';
import { STORE_ID } from '../../state/store';

/**
 * React custom hook to get the user config data
 *
 * @returns {object} site user config data
 */
export default function useUserConfig() {
	const { userConfig, isFetchingUserConfig } = useSelect( select => {
		const { getUserConfig, isRequestingUserConfig } = select( STORE_ID );

		return {
			userConfig: getUserConfig(),
			isFetchingUserConfig: isRequestingUserConfig(),
		};
	} );

	return {
		userConfig,
		isFetchingUserConfig,
	};
}
