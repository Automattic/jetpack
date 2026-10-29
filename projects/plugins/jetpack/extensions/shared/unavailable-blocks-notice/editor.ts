import { currentUserCan, getAdminUrl } from '@automattic/jetpack-script-data';
import registerUnavailableBlocksNotice from '.';

// Jetpack's blocks loaded, so only a block's own feature can be missing; the block reports which.
registerUnavailableBlocksNotice( () => ( {
	canManageModules: !! currentUserCan( 'manage_modules' ),
	modulesUrl: getAdminUrl( 'admin.php?page=jetpack_modules' ),
} ) );
