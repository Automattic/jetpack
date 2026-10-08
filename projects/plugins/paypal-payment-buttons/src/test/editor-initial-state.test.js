import { readFileSync } from 'node:fs';
import path from 'node:path';
import { runInNewContext } from 'node:vm';

// PHPUnit verifies that this fixture matches the inline script emitted by WordPress.
const script = readFileSync(
	path.resolve( __dirname, '../../tests/fixtures/editor-initial-state.js.txt' ),
	'utf8'
);

describe( 'PayPal editor initial state', () => {
	it( 'preserves existing Jetpack data while updating PayPal availability and flags', () => {
		const state = {
			wpcomBlogId: 123,
			available_blocks: {
				'ai-content-lens': { available: true },
				'paypal-payment-buttons': { available: false },
			},
			feature_flags: {
				'existing-feature': true,
				'paypal-payments-api-managed-buttons': true,
			},
		};
		const window = { Jetpack_Editor_Initial_State: state };

		runInNewContext( script, { window } );

		expect( window.Jetpack_Editor_Initial_State ).toBe( state );
		expect( state ).toEqual( {
			wpcomBlogId: 123,
			available_blocks: {
				'ai-content-lens': { available: true },
				'paypal-payment-buttons': { available: true },
			},
			feature_flags: {
				'existing-feature': true,
				'paypal-payments-api-managed-buttons': false,
			},
		} );
	} );

	it.each( [ undefined, {}, { wpcomBlogId: 123 } ] )(
		'initializes missing state maps from %j',
		initialState => {
			const window = {};
			if ( initialState !== undefined ) {
				window.Jetpack_Editor_Initial_State = initialState;
			}

			runInNewContext( script, { window } );

			expect( window.Jetpack_Editor_Initial_State ).toEqual( {
				...initialState,
				available_blocks: { 'paypal-payment-buttons': { available: true } },
				feature_flags: { 'paypal-payments-api-managed-buttons': false },
			} );
		}
	);
} );
