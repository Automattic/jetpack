import registerUnavailableBlocksNotice from '.';
import type { UnavailableBlocksData } from './get-unavailable-cause';

// Loaded on its own when Jetpack's editor bundle is not on the page.
registerUnavailableBlocksNotice(
	( window as unknown as { Jetpack_Unavailable_Blocks?: UnavailableBlocksData } )
		.Jetpack_Unavailable_Blocks
);
