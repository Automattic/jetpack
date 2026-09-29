import { wpcomTrackEvent } from '../../../common/tracks';
import { trackMarketplaceTab } from './marketplace-tab-tracks.ts';

document.addEventListener( 'DOMContentLoaded', () =>
	trackMarketplaceTab( document, wpcomTrackEvent )
);
