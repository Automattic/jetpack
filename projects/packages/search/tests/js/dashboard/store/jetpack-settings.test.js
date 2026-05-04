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
	setLastSavedExperience,
	saveExperience,
} from '../../../../src/dashboard/store/actions/jetpack-settings';
import jetpackSettingSelectors from '../../../../src/dashboard/store/selectors/jetpack-settings';

const {
	getActiveExperience,
	getPendingExperience,
	getSelectedExperience,
	getLastSavedExperience,
	isDirty,
} = jetpackSettingSelectors;

const buildState = ( overrides = {} ) => ( {
	jetpackSettings: {
		module_active: false,
		instant_search_enabled: false,
		pending_experience: null,
		last_saved_experience: null,
		...overrides,
	},
} );

describe( 'experience selectors', () => {
	describe( 'getActiveExperience', () => {
		test( 'returns "off" when module_active is false', () => {
			expect( getActiveExperience( buildState( { module_active: false } ) ) ).toBe( 'off' );
		} );

		test( 'returns "overlay" when instant_search_enabled is true', () => {
			expect(
				getActiveExperience( buildState( { module_active: true, instant_search_enabled: true } ) )
			).toBe( 'overlay' );
		} );

		test( 'returns "classic" when module is active without instant search', () => {
			expect(
				getActiveExperience( buildState( { module_active: true, instant_search_enabled: false } ) )
			).toBe( 'classic' );
		} );

		test( 'prefers last_saved_experience over derived value', () => {
			expect(
				getActiveExperience(
					buildState( {
						module_active: true,
						instant_search_enabled: false,
						last_saved_experience: 'embedded',
					} )
				)
			).toBe( 'embedded' );
		} );

		test( 'falls back to derived value when last_saved_experience is null', () => {
			expect(
				getActiveExperience(
					buildState( {
						module_active: true,
						instant_search_enabled: true,
						last_saved_experience: null,
					} )
				)
			).toBe( 'overlay' );
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

	describe( 'getLastSavedExperience', () => {
		test( 'returns the last_saved value', () => {
			expect( getLastSavedExperience( buildState( { last_saved_experience: 'embedded' } ) ) ).toBe(
				'embedded'
			);
		} );

		test( 'returns null when no last_saved value is set', () => {
			expect( getLastSavedExperience( buildState() ) ).toBeNull();
		} );
	} );

	describe( 'getSelectedExperience', () => {
		test( 'returns pending when set', () => {
			expect(
				getSelectedExperience(
					buildState( {
						module_active: true,
						instant_search_enabled: true,
						pending_experience: 'classic',
					} )
				)
			).toBe( 'classic' );
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

	describe( 'setLastSavedExperience', () => {
		test( 'returns SET_JETPACK_SETTINGS with last_saved_experience', () => {
			expect( setLastSavedExperience( 'embedded' ) ).toEqual( {
				type: 'SET_JETPACK_SETTINGS',
				options: { last_saved_experience: 'embedded' },
			} );
		} );
	} );

	describe( 'saveExperience', () => {
		test( 'saveExperience yields update, success, then setLastSavedExperience + setPendingExperience(null)', () => {
			const gen = saveExperience( 'overlay' );

			// Yield 1: the inner updateJetpackSettings generator.
			const yield1 = gen.next();
			expect( yield1.done ).toBe( false );
			expect( typeof yield1.value.next ).toBe( 'function' ); // inner generator

			// Simulate the inner generator returning successfully.
			const yield2 = gen.next( { ok: true } );
			expect( yield2.value ).toEqual( setLastSavedExperience( 'overlay' ) );

			const yield3 = gen.next();
			expect( yield3.value ).toEqual( setPendingExperience( null ) );

			expect( gen.next().done ).toBe( true );
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
