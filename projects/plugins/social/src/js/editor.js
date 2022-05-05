/**
 * External dependencies
 */
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import { name, settings } from '@automattic/jetpack-publicize';

registerPlugin( `jetpack-${ name }`, settings );
