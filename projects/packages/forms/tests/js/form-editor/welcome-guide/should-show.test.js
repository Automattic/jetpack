/**
 * Tests for the welcome guide visibility rules
 *
 * These tests verify the pure functions that decide whether the form editor
 * welcome guide opens, and how the force query argument is read.
 */

import {
	FORCE_QUERY_ARG,
	isWelcomeGuideEligible,
	isWelcomeGuideForced,
	isWelcomeGuideOpen,
	shouldPersistDismissal,
	shouldShowWelcomeGuide,
} from '../../../../src/form-editor/welcome-guide/should-show';

describe( 'welcome-guide/should-show', () => {
	describe( 'shouldShowWelcomeGuide', () => {
		test( 'shows the guide on first run, when no preference is stored', () => {
			expect(
				shouldShowWelcomeGuide( { preference: undefined, isForced: false, isEligible: true } )
			).toBe( true );
		} );

		test( 'shows the guide while the preference is still true', () => {
			expect(
				shouldShowWelcomeGuide( { preference: true, isForced: false, isEligible: true } )
			).toBe( true );
		} );

		test( 'hides the guide once it has been dismissed', () => {
			expect(
				shouldShowWelcomeGuide( { preference: false, isForced: false, isEligible: true } )
			).toBe( false );
		} );

		test( 'hides the guide from a user it is not meant for', () => {
			expect(
				shouldShowWelcomeGuide( { preference: undefined, isForced: false, isEligible: false } )
			).toBe( false );
		} );

		test( 'forcing overrides a dismissed preference', () => {
			expect(
				shouldShowWelcomeGuide( { preference: false, isForced: true, isEligible: true } )
			).toBe( true );
		} );

		test( 'forcing overrides ineligibility', () => {
			expect(
				shouldShowWelcomeGuide( { preference: undefined, isForced: true, isEligible: false } )
			).toBe( true );
		} );
	} );

	describe( 'isWelcomeGuideOpen', () => {
		const base = {
			preference: undefined,
			isForced: false,
			isEligible: true,
			isClosed: false,
			isReopened: false,
		};

		test( 'is open on first run', () => {
			expect( isWelcomeGuideOpen( base ) ).toBe( true );
		} );

		test( 'is closed after dismissal within the same page load', () => {
			expect( isWelcomeGuideOpen( { ...base, isClosed: true } ) ).toBe( false );
		} );

		test( 'is closed on a later load once the preference is false', () => {
			expect( isWelcomeGuideOpen( { ...base, preference: false } ) ).toBe( false );
		} );

		test( 'reopening brings it back for a user who already dismissed it', () => {
			expect( isWelcomeGuideOpen( { ...base, preference: false, isReopened: true } ) ).toBe( true );
		} );

		test( 'reopening overrides a dismissal made earlier in the same page load', () => {
			expect( isWelcomeGuideOpen( { ...base, isClosed: true, isReopened: true } ) ).toBe( true );
		} );

		test( 'stays closed for a user the guide is not meant for', () => {
			expect( isWelcomeGuideOpen( { ...base, isEligible: false } ) ).toBe( false );
		} );

		test( 'reopening from the Options menu works even when not eligible', () => {
			expect( isWelcomeGuideOpen( { ...base, isEligible: false, isReopened: true } ) ).toBe( true );
		} );
	} );

	describe( 'isWelcomeGuideEligible', () => {
		afterEach( () => {
			delete window.jetpackFormsWelcomeGuide;
		} );

		test( 'is false when PHP attached nothing', () => {
			expect( isWelcomeGuideEligible() ).toBe( false );
		} );

		test( 'is true when PHP marked the user eligible', () => {
			window.jetpackFormsWelcomeGuide = { isEligible: true };
			expect( isWelcomeGuideEligible() ).toBe( true );
		} );

		test( 'is false when PHP marked the user ineligible', () => {
			window.jetpackFormsWelcomeGuide = { isEligible: false };
			expect( isWelcomeGuideEligible() ).toBe( false );
		} );

		test( 'does not treat a truthy non-boolean as eligible', () => {
			window.jetpackFormsWelcomeGuide = { isEligible: '1' };
			expect( isWelcomeGuideEligible() ).toBe( false );
		} );
	} );

	describe( 'shouldPersistDismissal', () => {
		test( 'persists the first dismissal, when nothing is stored yet', () => {
			expect( shouldPersistDismissal( undefined ) ).toBe( true );
		} );

		test( 'persists when the guide is still pending', () => {
			expect( shouldPersistDismissal( true ) ).toBe( true );
		} );

		test( 'does not re-persist a dismissal that is already stored', () => {
			expect( shouldPersistDismissal( false ) ).toBe( false );
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
