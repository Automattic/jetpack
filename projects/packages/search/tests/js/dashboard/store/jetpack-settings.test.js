// Provide a default stub for @wordpress/data so the saveExperience generator
// can call select() without a real store registered in the test environment.
// We avoid jest.requireActual here because @wordpress/data uses lazy getters
// (e.g. AsyncModeProvider) that throw under Jest's module-factory evaluation.
jest.mock( '@wordpress/data', () => ( {
	// Used by src/dashboard/store/reducer/index.js
	combineReducers:
		reducers =>
		( state = {}, action ) =>
			Object.fromEntries(
				Object.entries( reducers ).map( ( [ key, reducer ] ) => [
					key,
					reducer( state[ key ], action ),
				] )
			),
	// Used by src/dashboard/store/actions/jetpack-settings.js
	select: () => ( { getActiveExperience: () => null } ),
} ) );

// Provide a default stub for @automattic/jetpack-analytics.
jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

import analytics from '@automattic/jetpack-analytics';
import {
	setPendingExperience,
	setActiveExperience,
	saveExperience,
} from '../../../../src/dashboard/store/actions/jetpack-settings';
import jetpackSettingSelectors from '../../../../src/dashboard/store/selectors/jetpack-settings';

const { getActiveExperience, getPendingExperience, getSelectedExperience, isDirty } =
	jetpackSettingSelectors;

const buildState = ( overrides = {} ) => ( {
	jetpackSettings: {
		module_active: false,
		instant_search_enabled: false,
		pending_experience: null,
		experience: null,
		...overrides,
	},
} );

describe( 'experience selectors', () => {
	describe( 'getActiveExperience', () => {
		test( 'returns the seeded `experience` value when present', () => {
			expect(
				getActiveExperience( buildState( { module_active: true, experience: 'embedded' } ) )
			).toBe( 'embedded' );
		} );

		test( 'falls back to derived "off" when module_active is false', () => {
			expect( getActiveExperience( buildState( { module_active: false } ) ) ).toBe( 'off' );
		} );

		test( 'falls back to derived "overlay" when instant_search_enabled is true', () => {
			expect(
				getActiveExperience( buildState( { module_active: true, instant_search_enabled: true } ) )
			).toBe( 'overlay' );
		} );

		test( 'falls back to derived "inline" when module is active without instant search', () => {
			expect(
				getActiveExperience( buildState( { module_active: true, instant_search_enabled: false } ) )
			).toBe( 'inline' );
		} );

		test( 'prefers seeded `experience` over the derivable booleans', () => {
			// instant_search_enabled would derive to 'overlay', but the seeded value wins.
			expect(
				getActiveExperience(
					buildState( {
						module_active: true,
						instant_search_enabled: true,
						experience: 'embedded',
					} )
				)
			).toBe( 'embedded' );
		} );
	} );

	describe( 'getPendingExperience', () => {
		test( 'returns the pending value', () => {
			expect( getPendingExperience( buildState( { pending_experience: 'overlay' } ) ) ).toBe(
				'overlay'
			);
		} );

		test( 'returns null when no pending value is set', () => {
			expect( getPendingExperience( buildState() ) ).toBeNull();
		} );
	} );

	describe( 'getSelectedExperience', () => {
		test( 'returns pending when set', () => {
			expect(
				getSelectedExperience(
					buildState( {
						module_active: true,
						instant_search_enabled: true,
						pending_experience: 'inline',
					} )
				)
			).toBe( 'inline' );
		} );

		test( 'returns active when pending is null', () => {
			expect(
				getSelectedExperience( buildState( { module_active: true, instant_search_enabled: true } ) )
			).toBe( 'overlay' );
		} );
	} );

	describe( 'isDirty', () => {
		test( 'is false when pending is null', () => {
			expect( isDirty( buildState() ) ).toBe( false );
		} );

		test( 'is false when pending equals active', () => {
			expect(
				isDirty(
					buildState( {
						module_active: true,
						instant_search_enabled: true,
						pending_experience: 'overlay',
					} )
				)
			).toBe( false );
		} );

		test( 'is true when pending differs from active', () => {
			expect(
				isDirty(
					buildState( {
						module_active: true,
						instant_search_enabled: true,
						pending_experience: 'embedded',
					} )
				)
			).toBe( true );
		} );
	} );
} );

describe( 'experience actions', () => {
	describe( 'setPendingExperience', () => {
		test( 'returns SET_JETPACK_SETTINGS with pending_experience', () => {
			expect( setPendingExperience( 'overlay' ) ).toEqual( {
				type: 'SET_JETPACK_SETTINGS',
				options: { pending_experience: 'overlay' },
			} );
		} );

		test( 'accepts null to clear', () => {
			expect( setPendingExperience( null ) ).toEqual( {
				type: 'SET_JETPACK_SETTINGS',
				options: { pending_experience: null },
			} );
		} );
	} );

	describe( 'setActiveExperience', () => {
		test( 'returns SET_JETPACK_SETTINGS with the experience field', () => {
			expect( setActiveExperience( 'embedded' ) ).toEqual( {
				type: 'SET_JETPACK_SETTINGS',
				options: { experience: 'embedded' },
			} );
		} );
	} );

	describe( 'saveExperience', () => {
		test( 'on success, yields setActiveExperience then setPendingExperience(null)', () => {
			const gen = saveExperience( 'overlay' );

			// Yield 1: the inner updateJetpackSettings generator.
			const yield1 = gen.next();
			expect( yield1.done ).toBe( false );
			expect( typeof yield1.value.next ).toBe( 'function' ); // inner generator

			// Simulate the inner generator returning a success-notice action.
			const yield2 = gen.next( { notice: { status: 'is-success' } } );
			expect( yield2.value ).toEqual( setActiveExperience( 'overlay' ) );

			const yield3 = gen.next();
			expect( yield3.value ).toEqual( setPendingExperience( null ) );

			expect( gen.next().done ).toBe( true );
		} );

		test( 'on failure, leaves pending in place and does not promote to active', () => {
			const gen = saveExperience( 'overlay' );

			// Yield 1: inner generator; simulate it returning an error notice.
			gen.next();
			const next = gen.next( { notice: { status: 'is-error' } } );

			// No further yields — pending stays so the user can retry.
			expect( next.done ).toBe( true );
			expect( next.value ).toBeUndefined();
		} );

		test( 'fires jetpack_search_experience_save with previous and new experience', () => {
			// The top-level jest.mock creates a single shared analytics instance used
			// by both the actions module and this test file. We reset and spy on it
			// directly rather than trying to re-isolate the module.
			const recordEvent = analytics.tracks.recordEvent;
			recordEvent.mockClear();

			// Drive the generator one step; analytics fires synchronously before yield.
			const gen = saveExperience( 'embedded' );
			gen.next();

			expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_search_experience_save', {
				previous_experience: null, // default stub returns null for getActiveExperience
				new_experience: 'embedded',
			} );
		} );
	} );
} );
