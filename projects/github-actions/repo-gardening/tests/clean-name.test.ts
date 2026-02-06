import cleanName from '../src/utils/clean-name.ts';

describe( 'cleanName', () => {
	test( 'capitalizes simple name', () => {
		expect( cleanName( 'search' ) ).toBe( 'Search' );
	} );

	test( 'replaces dashes with spaces and capitalizes each word', () => {
		expect( cleanName( 'my-cool-feature' ) ).toBe( 'My Cool Feature' );
	} );

	test( 'handles known exception: sharedaddy → Sharing', () => {
		expect( cleanName( 'sharedaddy' ) ).toBe( 'Sharing' );
	} );

	test( 'handles known exception: wordads → Ad', () => {
		expect( cleanName( 'wordads' ) ).toBe( 'Ad' );
	} );

	test( 'handles known exception: custom-post-types → Custom Content Types', () => {
		expect( cleanName( 'custom-post-types' ) ).toBe( 'Custom Content Types' );
	} );

	test( 'handles known exception with further dash processing: mu-wpcom-plugin → Mu Wpcom', () => {
		// mu-wpcom-plugin maps to 'mu-wpcom', which then gets split on dashes → 'Mu Wpcom'
		expect( cleanName( 'mu-wpcom-plugin' ) ).toBe( 'Mu Wpcom' );
	} );

	test( 'handles known exception: woo-sync → WooSync', () => {
		// woo-sync maps to 'WooSync', which has no dashes → 'WooSync'
		expect( cleanName( 'woo-sync' ) ).toBe( 'WooSync' );
	} );

	test( 'handles known exception: recurring-payments → Payments', () => {
		expect( cleanName( 'recurring-payments' ) ).toBe( 'Payments' );
	} );

	test( 'passes through unknown names with capitalization', () => {
		expect( cleanName( 'some-unknown-feature' ) ).toBe( 'Some Unknown Feature' );
	} );
} );
