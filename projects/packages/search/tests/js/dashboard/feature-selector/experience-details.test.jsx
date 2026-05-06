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
	test( 'shows Instant Search title and description when Overlay is selected', () => {
		renderWith( overlayActive, withInstantSearch );
		expect( screen.getByRole( 'heading', { name: 'Instant Search' } ) ).toBeInTheDocument();
		expect( screen.getByText( /search-as-you-type overlay that opens/i ) ).toBeInTheDocument();
	} );

	test( 'shows Customize and Edit widgets actions when Overlay is the active experience', () => {
		renderWith( overlayActive, withInstantSearch );
		expect( screen.getByRole( 'button', { name: /customize/i } ) ).toHaveAttribute(
			'href',
			'admin.php?page=jetpack-search-configure'
		);
		expect( screen.getByRole( 'button', { name: /edit widgets/i } ) ).toHaveAttribute(
			'href',
			'widgets.php'
		);
	} );

	test( 'hides Customize action when supportsInstantSearch is false', () => {
		renderWith( overlayActive, withClassicOnly );
		expect( screen.queryByRole( 'button', { name: /customize/i } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /edit widgets/i } ) ).toBeInTheDocument();
	} );

	test( 'hides actions when Overlay is selected but not yet the active experience', () => {
		// Active is 'inline'; pending_experience='overlay' → selected = overlay,
		// active = inline. Description should still render but actions must not.
		renderWith( { ...inlineActive, pending_experience: 'overlay' }, withInstantSearch );
		expect( screen.getByRole( 'heading', { name: 'Instant Search' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /customize/i } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /edit widgets/i } ) ).not.toBeInTheDocument();
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

	test( 'actions are aria-disabled and have no href while settings are saving', () => {
		renderWith( { ...overlayActive, is_updating: true }, withInstantSearch );
		const customize = screen.getByRole( 'button', { name: /customize/i } );
		const widgets = screen.getByRole( 'button', { name: /edit widgets/i } );
		expect( customize ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( customize ).not.toHaveAttribute( 'href' );
		expect( widgets ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( widgets ).not.toHaveAttribute( 'href' );
	} );
} );
