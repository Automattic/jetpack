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
