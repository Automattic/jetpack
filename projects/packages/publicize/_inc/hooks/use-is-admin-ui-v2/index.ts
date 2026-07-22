import { siteHasFeature } from '@automattic/jetpack-script-data';
import { features } from '../../utils/constants';

/**
 * Whether the Social admin UI v2 feature is enabled.
 *
 * @return True when the site has the admin UI v2 feature.
 */
export function useIsAdminUiV2(): boolean {
	return siteHasFeature( features.ADMIN_UI_V2 );
}
