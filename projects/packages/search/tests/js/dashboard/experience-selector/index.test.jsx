import { render, screen } from '@testing-library/react';
import { createReduxStore, createRegistry, RegistryProvider } from '@wordpress/data';
import ExperienceSelector from '../../../../src/dashboard/components/experience-selector';
import { storeConfig, STORE_ID } from '../../../../src/dashboard/store';

const renderWith = ( jetpackSettings, extraInitialState = {} ) => {
	const registry = createRegistry();
	const store = createReduxStore( STORE_ID, {
		...storeConfig,
		initialState: {
			...( storeConfig.initialState || {} ),
			jetpackSettings,
			...extraInitialState,
		},
	} );
	registry.register( store );
	return render(
		<RegistryProvider value={ registry }>
			<ExperienceSelector />
		</RegistryProvider>
	);
};

const baseSettings = {
	module_active: true,
	instant_search_enabled: true,
	pending_experience: null,
	experience: null,
	is_updating: false,
};

describe( '<ExperienceSelector>', () => {
	test( 'renders four cards in display order', () => {
		renderWith( baseSettings );
		const headings = screen.getAllByRole( 'heading', { level: 3 } );
		expect( headings.map( h => h.textContent ) ).toEqual( [
			'Embedded search',
			'Overlay search',
			'Theme search',
			'Off',
		] );
	} );

	test( 'renders the page heading at h2', () => {
		renderWith( baseSettings );
		expect(
			screen.getByRole( 'heading', {
				level: 2,
				name: /select a search experience for your visitors/i,
			} )
		).toBeInTheDocument();
	} );

	test( 'fieldset has an accessible group name', () => {
		renderWith( baseSettings );
		expect(
			screen.getByRole( 'group', { name: /select a search experience for your visitors/i } )
		).toBeInTheDocument();
	} );

	test( 'renders a click-anywhere commit overlay for every non-active experience', () => {
		// instant_search_enabled=true → active = 'overlay'
		renderWith( baseSettings );
		expect( screen.getByRole( 'button', { name: /use embedded search/i } ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /^use overlay search$/i } )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /use theme search/i } ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: /turn off jetpack search/i } )
		).toBeInTheDocument();
	} );

	test( 'no bottom Save button anywhere on the form', () => {
		renderWith( baseSettings );
		expect( screen.queryByRole( 'button', { name: /^save$/i } ) ).not.toBeInTheDocument();
	} );

	test( 'no pending-state notice — saves are committed via the per-card button directly', () => {
		renderWith( baseSettings );
		expect( screen.queryByText( /selected, save to apply/i ) ).not.toBeInTheDocument();
	} );

	test( 'hides the Off row on WordPress.com (parity with legacy ModuleControl)', () => {
		renderWith( baseSettings, { siteData: { isWpcom: true } } );
		expect(
			screen.getByRole( 'heading', { level: 3, name: /embedded search/i } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'heading', { level: 3, name: /overlay search/i } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'heading', { level: 3, name: /theme search/i } )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'heading', { level: 3, name: /^off$/i } ) ).not.toBeInTheDocument();
	} );

	test( 'disables Embedded and Overlay commit overlays when plan supports only Classic Search', () => {
		// Active = inline here so all four cards surface a commit overlay — we
		// can assert directly on which are disabled. The overlay uses
		// `aria-disabled` (not native `disabled`) so it stays in the tab
		// order and AT can read the upsell hint.
		renderWith(
			{ ...baseSettings, instant_search_enabled: false },
			{ sitePlan: { supports_only_classic_search: true } }
		);
		expect( screen.getByRole( 'button', { name: /use embedded search/i } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByRole( 'button', { name: /use overlay search/i } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect(
			screen.getByRole( 'button', { name: /turn off jetpack search/i } )
		).not.toHaveAttribute( 'aria-disabled', 'true' );
	} );
} );
