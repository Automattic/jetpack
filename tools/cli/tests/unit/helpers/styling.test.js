/**
 * External dependencies
 */
import chai from 'chai';

/**
 * Internal dependencies
 */
import { chalkJetpackGreen } from '../../../helpers/styling.js';

describe( 'styling', function () {
	it.skip( 'Text should be returned as green', function () {
		chai
			.expect( chalkJetpackGreen( 'Jetpack Green' ) )
			.to.equal( '\u001b[38;5;41mJetpack Green\u001b[39m' );
	} );
} );
