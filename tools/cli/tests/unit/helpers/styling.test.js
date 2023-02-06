import { chalkJetpackGreen } from '../../../helpers/styling.js';

describe( 'styling', () => {
	test.skip( 'Text should be returned as green', function () {
		expect( chalkJetpackGreen( 'Jetpack Green' ) ).toBe( '\u001b[38;5;41mJetpack Green\u001b[39m' );
	} );
} );
