import domReady from '@wordpress/dom-ready';
import { initializeMembershipButtons } from '../../shared/memberships';

import './view.scss';

const name = 'recurring-payments';
const blockClassName = 'wp-block-jetpack-' + name;

if ( typeof window !== 'undefined' ) {
	domReady( () => {
		initializeMembershipButtons( '.' + blockClassName + ' a' );
	} );
}
