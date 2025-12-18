import { siteHasFeature } from '@automattic/jetpack-script-data';
import { dispatch } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as socialStore } from '../../social-store';
import { features } from '../../utils';

/**
 * Handle a particular Jetpack Editor action.
 *
 * @param sidebarToOpen  - The sidebar to open.
 * @param removeQueryArg - Whether the query parameter should be removed.
 *
 * @return - Whether the query parameter should be removed.
 */
export function handleSharePostAction(
	sidebarToOpen = 'jetpack-sidebar/jetpack',
	removeQueryArg = false
) {
	const { enableComplementaryArea } = dispatch( interfaceStore ) as {
		enableComplementaryArea: ( scope: string, area: string ) => void;
	};

	// First open the sidebar
	enableComplementaryArea( 'core', sidebarToOpen );

	const { openSharePostModal, openUnifiedModal } = dispatch( socialStore );
	// Then open the share post modal
	if ( siteHasFeature( features.UNIFIED_UI_V1 ) ) {
		openUnifiedModal();
	} else {
		openSharePostModal();
	}

	return removeQueryArg;
}
