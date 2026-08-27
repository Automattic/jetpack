/**
 * Tests for the form editor welcome guide component
 *
 * The pure visibility rules live in should-show.test.js. This covers the parts
 * that only exist once the component is mounted: which preference writes it
 * makes, and when.
 */

/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCallback, useState } from 'react';

// Mocks must be registered before importing the component under test.
const set = jest.fn();
const recordEvent = jest.fn();
const preferences = new Map();
let currentPostType = 'jetpack_form';

await jest.unstable_mockModule( '@wordpress/preferences', () => ( {
	store: 'core/preferences',
} ) );

await jest.unstable_mockModule( '@wordpress/editor', () => ( {
	store: 'core/editor',
} ) );

await jest.unstable_mockModule( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: () => ( { tracks: { recordEvent } } ),
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch: jest.fn( () => ( { set } ) ),
	useSelect: jest.fn( mapSelect =>
		mapSelect( storeName =>
			storeName === 'core/editor'
				? { getCurrentPostType: () => currentPostType }
				: { get: ( scope, name ) => preferences.get( `${ scope }.${ name }` ) }
		)
	),
} ) );

/*
 * `Guide` renders into a portal and pulls in a large slice of
 * @wordpress/components. The mock keeps the two behaviours the tests depend
 * on: it renders only the page you are on, and it owns the page number — which
 * is why the slide tracker has to live inside the page content.
 */
await jest.unstable_mockModule( '@wordpress/components', () => ( {
	Guide: ( { contentLabel, onFinish, pages = [] } ) => {
		const [ current, setCurrent ] = useState( 0 );
		const goForward = useCallback( () => setCurrent( page => page + 1 ), [] );
		const goBack = useCallback( () => setCurrent( page => page - 1 ), [] );

		return (
			<div data-testid="guide">
				{ contentLabel }
				{ pages[ current ]?.content }
				<button type="button" onClick={ goForward }>
					Next
				</button>
				<button type="button" onClick={ goBack }>
					Previous
				</button>
				<button type="button" onClick={ onFinish }>
					Finish
				</button>
			</div>
		);
	},
} ) );

/**
 * Internal dependencies
 */
const { FormWelcomeGuide, PREFERENCE_NAME, PREFERENCE_SCOPE } = await import(
	'../../../../src/form-editor/welcome-guide/index'
);

const CORE_SCOPE = 'core/edit-post';

/**
 * Seeds the preference store the mocked `useSelect` reads from.
 *
 * @param {object}            values                  - Preference values.
 * @param {boolean|undefined} values.jetpackForms     - The jetpack/forms welcomeGuide preference.
 * @param {boolean|undefined} values.coreWelcomeGuide - The core/edit-post welcomeGuide preference.
 */
const seedPreferences = ( { jetpackForms, coreWelcomeGuide } = {} ) => {
	preferences.clear();
	preferences.set( `${ PREFERENCE_SCOPE }.${ PREFERENCE_NAME }`, jetpackForms );
	preferences.set( `${ CORE_SCOPE }.${ PREFERENCE_NAME }`, coreWelcomeGuide );
};

/**
 * Sets the editor URL the guide reads the force argument from.
 *
 * @param {string} search - The query string, including the leading `?`, or empty.
 */
const setSearch = search => {
	window.history.replaceState( {}, '', `/wp-admin/post-new.php${ search }` );
};

describe( 'FormWelcomeGuide', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		seedPreferences();
		setSearch( '' );
		currentPostType = 'jetpack_form';
		window.jetpackFormsWelcomeGuide = { isEligible: true };
	} );

	it( 'opens for an eligible user who has not dismissed it', () => {
		render( <FormWelcomeGuide /> );

		expect( screen.getByTestId( 'guide' ) ).toBeInTheDocument();
	} );

	it( 'stays closed once the dismissal is stored', () => {
		seedPreferences( { jetpackForms: false } );

		render( <FormWelcomeGuide /> );

		expect( screen.queryByTestId( 'guide' ) ).not.toBeInTheDocument();
	} );

	it( 'stays closed for a user it is not meant for', () => {
		window.jetpackFormsWelcomeGuide = { isEligible: false };

		render( <FormWelcomeGuide /> );

		expect( screen.queryByTestId( 'guide' ) ).not.toBeInTheDocument();
	} );

	it( 'persists the dismissal the first time it is closed', async () => {
		render( <FormWelcomeGuide /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Finish' } ) );

		expect( set ).toHaveBeenCalledWith( PREFERENCE_SCOPE, PREFERENCE_NAME, false );
	} );

	it( 'does not re-persist a dismissal that is already stored', async () => {
		// Already dismissed, but forced open so it can be closed again.
		seedPreferences( { jetpackForms: false } );
		setSearch( '?jetpack_forms_welcome_guide=1' );

		render( <FormWelcomeGuide /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Finish' } ) );

		expect( set ).not.toHaveBeenCalledWith( PREFERENCE_SCOPE, PREFERENCE_NAME, false );
	} );

	/*
	 * The query argument is documented as a way to re-test the first run
	 * without resetting preferences, so closing a forced guide must not spend
	 * the real first run of whoever followed the link.
	 */
	it( 'never persists a dismissal when the guide was forced open', async () => {
		setSearch( '?jetpack_forms_welcome_guide=1' );

		render( <FormWelcomeGuide /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Finish' } ) );

		expect( set ).not.toHaveBeenCalledWith( PREFERENCE_SCOPE, PREFERENCE_NAME, false );
	} );

	/*
	 * Regression test for the earlier review feedback: bringing the guide back
	 * from the Options menu must not undo a stored dismissal, or it starts
	 * auto-opening on every later load.
	 */
	it( 'never writes the jetpack/forms preference back to true when reopened', () => {
		seedPreferences( { jetpackForms: false, coreWelcomeGuide: false } );

		const { rerender } = render( <FormWelcomeGuide /> );

		// The user picks Options -> Welcome Guide, which flips core's preference.
		seedPreferences( { jetpackForms: false, coreWelcomeGuide: true } );
		rerender( <FormWelcomeGuide /> );

		expect( set ).not.toHaveBeenCalledWith( PREFERENCE_SCOPE, PREFERENCE_NAME, true );
	} );

	it( 'reopens and clears core’s preference when the Options item is toggled on', () => {
		seedPreferences( { jetpackForms: false, coreWelcomeGuide: false } );

		const { rerender } = render( <FormWelcomeGuide /> );
		expect( screen.queryByTestId( 'guide' ) ).not.toBeInTheDocument();

		seedPreferences( { jetpackForms: false, coreWelcomeGuide: true } );
		rerender( <FormWelcomeGuide /> );

		expect( screen.getByTestId( 'guide' ) ).toBeInTheDocument();
		expect( set ).toHaveBeenCalledWith( CORE_SCOPE, PREFERENCE_NAME, undefined );
	} );

	/*
	 * Core's item is a toggle, so intercepting it means undoing a write the
	 * user did not intend. Clearing puts the preference back to untouched;
	 * storing false would read as "opted out" and silently cost them core's
	 * welcome modal in the post and page editors.
	 */
	it( 'clears core’s preference rather than storing an opt-out', () => {
		seedPreferences( { jetpackForms: false, coreWelcomeGuide: false } );

		const { rerender } = render( <FormWelcomeGuide /> );

		seedPreferences( { jetpackForms: false, coreWelcomeGuide: true } );
		rerender( <FormWelcomeGuide /> );

		expect( set ).not.toHaveBeenCalledWith( CORE_SCOPE, PREFERENCE_NAME, false );
	} );

	/*
	 * Core's own default is true until the editor bundle's subscription
	 * suppresses it, and a user who deliberately re-enabled core's guide has
	 * true persisted, which beats that suppression. Neither is a request for
	 * anything, so neither may persist a change to core's preference.
	 */
	it( 'does not touch core’s preference when it is already true on mount', () => {
		seedPreferences( { coreWelcomeGuide: true } );

		render( <FormWelcomeGuide /> );

		expect( set ).not.toHaveBeenCalledWith( CORE_SCOPE, PREFERENCE_NAME, expect.anything() );
		expect( set ).not.toHaveBeenCalledWith( CORE_SCOPE, PREFERENCE_NAME, undefined );
	} );

	/*
	 * The bundle is only enqueued on a form editor page load, but the component
	 * stays mounted across in-editor navigation back out to a post or page.
	 * The preference it watches is global to the editor, so it needs its own
	 * post type check to stop following the user out.
	 */
	describe( 'outside the form editor', () => {
		beforeEach( () => {
			currentPostType = 'page';
		} );

		it( 'stays closed even for an eligible user', () => {
			render( <FormWelcomeGuide /> );

			expect( screen.queryByTestId( 'guide' ) ).not.toBeInTheDocument();
		} );

		it( 'does not open or clear core’s preference when core’s guide is re-enabled', () => {
			seedPreferences( { jetpackForms: false, coreWelcomeGuide: false } );

			const { rerender } = render( <FormWelcomeGuide /> );

			seedPreferences( { jetpackForms: false, coreWelcomeGuide: true } );
			rerender( <FormWelcomeGuide /> );

			expect( screen.queryByTestId( 'guide' ) ).not.toBeInTheDocument();
			expect( set ).not.toHaveBeenCalledWith( CORE_SCOPE, PREFERENCE_NAME, expect.anything() );
			expect( set ).not.toHaveBeenCalledWith( CORE_SCOPE, PREFERENCE_NAME, undefined );
		} );
	} );

	describe( 'when core’s guide is stored as pending', () => {
		/*
		 * Reached by picking Options -> "Welcome Guide" on a load where this
		 * bundle was absent — in-editor navigation into a form never re-runs the
		 * enqueue. Core's item is a toggle, so it persists true, and PHP is the
		 * only side that can tell that stored true from core's own default.
		 */
		beforeEach( () => {
			window.jetpackFormsWelcomeGuide = { isEligible: false, isCoreGuidePending: true };
			setSearch( '' );
		} );

		it( 'opens on mount even though the user is not eligible', () => {
			seedPreferences( { jetpackForms: false, coreWelcomeGuide: true } );

			render( <FormWelcomeGuide /> );

			expect( screen.getByTestId( 'guide' ) ).toBeInTheDocument();
		} );

		it( 'clears core’s preference so its generic modal stops reopening', () => {
			seedPreferences( { jetpackForms: false, coreWelcomeGuide: true } );

			render( <FormWelcomeGuide /> );

			expect( set ).toHaveBeenCalledWith( CORE_SCOPE, PREFERENCE_NAME, undefined );
			expect( set ).not.toHaveBeenCalledWith( CORE_SCOPE, PREFERENCE_NAME, false );
		} );

		it( 'leaves a newcomer alone, whose true is core’s default rather than stored', () => {
			// PHP reports pending only for a stored true, so the flag is false
			// here even though the preference reads true.
			window.jetpackFormsWelcomeGuide = { isEligible: true, isCoreGuidePending: false };
			seedPreferences( { jetpackForms: undefined, coreWelcomeGuide: true } );

			render( <FormWelcomeGuide /> );

			expect( set ).not.toHaveBeenCalledWith( CORE_SCOPE, PREFERENCE_NAME, false );
		} );
	} );

	describe( 'analytics', () => {
		/**
		 * The properties of the first matching event.
		 *
		 * @param {string} event - Event name.
		 * @return {object|undefined} The recorded properties.
		 */
		const propsFor = event => recordEvent.mock.calls.find( ( [ name ] ) => name === event )?.[ 1 ];

		it( 'records one view when the guide opens, with why it opened', () => {
			render( <FormWelcomeGuide /> );

			expect( recordEvent ).toHaveBeenCalledWith(
				'jetpack_forms_welcome_guide_view',
				expect.objectContaining( { origin: 'auto', slide_count: 5 } )
			);
		} );

		it( 'records nothing at all when the guide does not open', () => {
			seedPreferences( { jetpackForms: false } );

			render( <FormWelcomeGuide /> );

			expect( recordEvent ).not.toHaveBeenCalled();
		} );

		it( 'attributes a forced guide to the query argument, not to a real audience', () => {
			setSearch( '?jetpack_forms_welcome_guide=1' );
			seedPreferences( { jetpackForms: false } );

			render( <FormWelcomeGuide /> );

			expect( propsFor( 'jetpack_forms_welcome_guide_view' ) ).toEqual(
				expect.objectContaining( { origin: 'forced' } )
			);
		} );

		it( 'records the first slide without any navigation', () => {
			render( <FormWelcomeGuide /> );

			expect( propsFor( 'jetpack_forms_welcome_guide_slide_view' ) ).toEqual(
				expect.objectContaining( { slide: 1, slide_count: 5, origin: 'auto' } )
			);
		} );

		it( 'records each slide the user moves to, forwards and back', async () => {
			const user = userEvent.setup();
			render( <FormWelcomeGuide /> );

			await user.click( screen.getByRole( 'button', { name: 'Next' } ) );
			await user.click( screen.getByRole( 'button', { name: 'Next' } ) );
			await user.click( screen.getByRole( 'button', { name: 'Previous' } ) );

			const slides = recordEvent.mock.calls
				.filter( ( [ name ] ) => name === 'jetpack_forms_welcome_guide_slide_view' )
				.map( ( [ , props ] ) => props.slide );

			expect( slides ).toEqual( [ 1, 2, 3, 2 ] );
		} );

		it( 'reports how far the user got when they leave', async () => {
			const user = userEvent.setup();
			render( <FormWelcomeGuide /> );

			await user.click( screen.getByRole( 'button', { name: 'Next' } ) );
			await user.click( screen.getByRole( 'button', { name: 'Finish' } ) );

			expect( recordEvent ).toHaveBeenCalledWith(
				'jetpack_forms_welcome_guide_dismiss',
				expect.objectContaining( { slide: 2, slide_count: 5, origin: 'auto' } )
			);
		} );

		it( 'records a forward move when the user advances', async () => {
			const user = userEvent.setup();
			render( <FormWelcomeGuide /> );

			await user.click( screen.getByRole( 'button', { name: 'Next' } ) );

			expect( recordEvent ).toHaveBeenCalledWith(
				'jetpack_forms_welcome_guide_next_click',
				expect.objectContaining( { from: 1, to: 2, slide_count: 5, origin: 'auto' } )
			);
		} );

		it( 'records a backward move when the user goes back', async () => {
			const user = userEvent.setup();
			render( <FormWelcomeGuide /> );

			await user.click( screen.getByRole( 'button', { name: 'Next' } ) );
			await user.click( screen.getByRole( 'button', { name: 'Previous' } ) );

			expect( recordEvent ).toHaveBeenCalledWith(
				'jetpack_forms_welcome_guide_previous_click',
				expect.objectContaining( { from: 2, to: 1 } )
			);
		} );

		it( 'does not count arriving at the first slide as navigation', () => {
			render( <FormWelcomeGuide /> );

			const navigations = recordEvent.mock.calls.filter(
				( [ name ] ) => name.endsWith( '_next_click' ) || name.endsWith( '_previous_click' )
			);

			expect( navigations ).toHaveLength( 0 );
		} );
	} );
} );
