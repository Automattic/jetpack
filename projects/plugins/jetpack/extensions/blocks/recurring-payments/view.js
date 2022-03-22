/**
 * External dependencies
 */
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import { initializeMembershipButtons } from '../../shared/memberships';

/**
 * Style dependencies
 */
import './view.scss';

const name = 'recurring-payments';
const blockClassName = 'wp-block-jetpack-' + name;

if ( typeof window !== 'undefined' ) {
	domReady( () => initializeMembershipButtons( '.' + blockClassName + ' a' ) );
}
