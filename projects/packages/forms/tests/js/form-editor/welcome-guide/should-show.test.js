/**
 * Tests for the welcome guide visibility rules
 *
 * These tests verify the pure functions that decide whether the form editor
 * welcome guide opens, and how the force query argument is read.
 */

import {
	FORCE_QUERY_ARG,
	isWelcomeGuideForced,
	shouldShowWelcomeGuide,
} from '../../../../src/form-editor/welcome-guide/should-show';

describe( 'welcome-guide/should-show', () => {
	describe( 'shouldShowWelcomeGuide', () => {
		test( 'shows the guide on first run, when no preference is stored', () => {
			expect( shouldShowWelcomeGuide( { preference: undefined, isForced: false } ) ).toBe( true );
		} );

		test( 'shows the guide while the preference is still true', () => {
			expect( shouldShowWelcomeGuide( { preference: true, isForced: false } ) ).toBe( true );
		} );

		test( 'hides the guide once it has been dismissed', () => {
			expect( shouldShowWelcomeGuide( { preference: false, isForced: false } ) ).toBe( false );
		} );

		test( 'forcing overrides a dismissed preference', () => {
			expect( shouldShowWelcomeGuide( { preference: false, isForced: true } ) ).toBe( true );
		} );
	} );

	describe( 'isWelcomeGuideForced', () => {
		test( 'returns false when the argument is absent', () => {
			expect( isWelcomeGuideForced( '?post=1&action=edit' ) ).toBe( false );
		} );

		test( 'returns false for an empty search string', () => {
			expect( isWelcomeGuideForced( '' ) ).toBe( false );
		} );

		test( 'returns true when the argument is set to 1', () => {
			expect( isWelcomeGuideForced( `?${ FORCE_QUERY_ARG }=1` ) ).toBe( true );
		} );

		test( 'returns true when the argument is present with no value', () => {
			expect( isWelcomeGuideForced( `?${ FORCE_QUERY_ARG }` ) ).toBe( true );
		} );

		test( 'returns false when the argument is explicitly disabled', () => {
			expect( isWelcomeGuideForced( `?${ FORCE_QUERY_ARG }=0` ) ).toBe( false );
			expect( isWelcomeGuideForced( `?${ FORCE_QUERY_ARG }=false` ) ).toBe( false );
		} );

		test( 'finds the argument alongside other query arguments', () => {
			expect( isWelcomeGuideForced( `?post=12&${ FORCE_QUERY_ARG }=1&action=edit` ) ).toBe( true );
		} );
	} );
} );
