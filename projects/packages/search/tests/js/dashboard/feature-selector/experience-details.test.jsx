import { render, screen } from '@testing-library/react';
import { createReduxStore, createRegistry, RegistryProvider } from '@wordpress/data';
import ExperienceDetails from '../../../../src/dashboard/components/feature-selector/experience-details';
import { storeConfig, STORE_ID } from '../../../../src/dashboard/store';

const renderWith = ( jetpackSettings, sitePlan = {} ) => {
	const registry = createRegistry();
	const store = createReduxStore( STORE_ID, {
		...storeConfig,
		initialState: {
			...( storeConfig.initialState || {} ),
			jetpackSettings,
			sitePlan,
		},
	} );
	registry.register( store );
	return render(
		<RegistryProvider value={ registry }>
			<ExperienceDetails />
		</RegistryProvider>
	);
};

const overlayActive = {
	module_active: true,
	instant_search_enabled: true,
	pending_experience: null,
	experience: null,
};

const inlineActive = {
	module_active: true,
	instant_search_enabled: false,
	pending_experience: null,
	experience: null,
};

const withInstantSearch = { supports_instant_search: true };
const withClassicOnly = { supports_instant_search: false };

describe( '<ExperienceDetails>', () => {
	test( 'shows Overlay search title and description when Overlay is selected', () => {
		renderWith( overlayActive, withInstantSearch );
		expect( screen.getByRole( 'heading', { name: 'Overlay search' } ) ).toBeInTheDocument();
		expect( screen.getByText( /search-as-you-type overlay that opens/i ) ).toBeInTheDocument();
	} );

	test( 'renders Customize and Edit widgets as anchors with the correct hrefs when Overlay is active', () => {
		renderWith( overlayActive, withInstantSearch );
		const customize = screen.getByRole( 'button', { name: /customize/i } );
		const widgets = screen.getByRole( 'button', { name: /edit widgets/i } );
		expect( customize.tagName ).toBe( 'A' );
		expect( customize ).toHaveAttribute( 'href', 'admin.php?page=jetpack-search-configure' );
		expect( widgets.tagName ).toBe( 'A' );
		expect( widgets ).toHaveAttribute( 'href', 'widgets.php' );
	} );

	test( 'hides Customize action when supportsInstantSearch is false', () => {
		renderWith( overlayActive, withClassicOnly );
		expect( screen.queryByRole( 'button', { name: /customize/i } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /edit widgets/i } ) ).toBeInTheDocument();
	} );

	test( 'renders actions as disabled buttons (no href) when Overlay is selected but not yet active', () => {
		// Active is 'inline'; pending_experience='overlay' → selected = overlay,
		// active = inline. Actions render so users see what's coming, but they
		// fall back to a real <button> so the library's disabled styling lands
		// and AT users aren't told a non-functional element is a link.
		renderWith( { ...inlineActive, pending_experience: 'overlay' }, withInstantSearch );
		expect( screen.getByRole( 'heading', { name: 'Overlay search' } ) ).toBeInTheDocument();
		const customize = screen.getByRole( 'button', { name: /customize/i } );
		const widgets = screen.getByRole( 'button', { name: /edit widgets/i } );
		expect( customize.tagName ).toBe( 'BUTTON' );
		expect( customize ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( widgets.tagName ).toBe( 'BUTTON' );
		expect( widgets ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	test( 'shows only the title for non-Overlay experiences', () => {
		renderWith( inlineActive, withInstantSearch );
		expect( screen.getByRole( 'heading', { name: 'Theme search' } ) ).toBeInTheDocument();
		expect(
			screen.queryByText( /search-as-you-type overlay that opens/i )
		).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /customize/i } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /edit widgets/i } ) ).not.toBeInTheDocument();
	} );

	test( 'actions are aria-disabled while settings are saving', () => {
		renderWith( { ...overlayActive, is_updating: true }, withInstantSearch );
		expect( screen.getByRole( 'button', { name: /customize/i } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByRole( 'button', { name: /edit widgets/i } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );
} );
