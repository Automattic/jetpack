/**
 * Internal dependencies
 */

import { init } from './carousel';

if ( document.readyState !== 'loading' ) {
	init();
} else {
	document.addEventListener( 'DOMContentLoaded', init );
}
