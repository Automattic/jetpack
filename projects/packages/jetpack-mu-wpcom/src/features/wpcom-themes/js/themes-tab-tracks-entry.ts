import { wpcomTrackEvent } from '../../../common/tracks';
import { trackThemesTab } from './themes-tab-tracks.ts';

document.addEventListener( 'DOMContentLoaded', () => {
	trackThemesTab( document, wpcomTrackEvent );
} );
