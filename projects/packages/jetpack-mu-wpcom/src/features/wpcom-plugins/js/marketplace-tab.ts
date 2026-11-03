import { wpcomTrackEvent } from '../../../common/tracks';
import { keepDetailsModals } from './details-modal.js';
import { trackMarketplaceTab } from './marketplace-tab-tracks.ts';

document.addEventListener( 'DOMContentLoaded', () => {
	trackMarketplaceTab( document, wpcomTrackEvent );
	keepDetailsModals( document );
} );
