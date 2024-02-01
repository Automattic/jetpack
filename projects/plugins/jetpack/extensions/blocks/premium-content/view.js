import './view.scss';
import { handleIframeResult } from '../../../extensions/shared/memberships';

document.addEventListener( 'DOMContentLoaded', function () {
	if ( typeof window !== 'undefined' ) {
		window.addEventListener( 'message', handleIframeResult, false );
	}
} );
