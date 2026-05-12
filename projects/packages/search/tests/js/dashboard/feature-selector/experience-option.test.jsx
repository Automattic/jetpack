/* eslint-disable testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import { createReduxStore, createRegistry, RegistryProvider } from '@wordpress/data';
import ExperienceOption from '../../../../src/dashboard/components/feature-selector/experience-option';
import { storeConfig, STORE_ID } from '../../../../src/dashboard/store';

const renderWith = ( jetpackSettings, props, sitePlan = {} ) => {
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
			<ExperienceOption { ...props } />
		</RegistryProvider>
	);
};

const baseSettings = {
	module_active: true,
	instant_search_enabled: true,
	pending_experience: null,
	experience: null,
};

describe( '<ExperienceOption>', () => {
	test( 'renders title and description', () => {
		renderWith( baseSettings, { experience: 'embedded' } );
		expect( screen.getByText( 'Embedded search' ) ).toBeInTheDocument();
		expect( screen.getByText( /A custom search page you build with blocks/i ) ).toBeInTheDocument();
	} );

	test( 'shows RECOMMENDED badge only on Embedded', () => {
		const { rerender } = renderWith( baseSettings, { experience: 'embedded' } );
		expect( screen.getByLabelText( 'Recommended' ) ).toBeInTheDocument();

		const registry2 = createRegistry();
		const store2 = createReduxStore( STORE_ID, {
			...storeConfig,
			initialState: { ...( storeConfig.initialState || {} ), jetpackSettings: baseSettings },
		} );
		registry2.register( store2 );
		rerender(
			<RegistryProvider value={ registry2 }>
				<ExperienceOption experience="overlay" />
			</RegistryProvider>
		);
		expect( screen.queryByLabelText( 'Recommended' ) ).not.toBeInTheDocument();
	} );

	test( 'shows ACTIVE badge when experience matches active state', () => {
		// instant_search_enabled=true → active = 'overlay'
		renderWith( baseSettings, { experience: 'overlay' } );
		expect( screen.getByLabelText( 'Active' ) ).toBeInTheDocument();
	} );

	test( 'does not show ACTIVE badge on non-active rows', () => {
		renderWith( baseSettings, { experience: 'inline' } );
		expect( screen.queryByLabelText( 'Active' ) ).not.toBeInTheDocument();
	} );

	test( 'radio is checked when experience matches selected', () => {
		renderWith( { ...baseSettings, pending_experience: 'inline' }, { experience: 'inline' } );
		expect( screen.getByRole( 'radio', { name: /theme search/i } ) ).toBeChecked();
	} );

	test( 'clicking the row dispatches setPendingExperience', () => {
		renderWith( baseSettings, { experience: 'inline' } );
		fireEvent.click( screen.getByRole( 'radio', { name: /theme search/i } ) );
		expect( screen.getByRole( 'radio', { name: /theme search/i } ) ).toBeChecked();
	} );

	test( 'renders the radio as disabled when disabled prop is true', () => {
		renderWith( baseSettings, { experience: 'embedded', disabled: true } );
		expect( screen.getByRole( 'radio', { name: /embedded search/i } ) ).toBeDisabled();
	} );

	test( 'shows a tooltip explaining why the row is disabled', () => {
		renderWith( baseSettings, { experience: 'embedded', disabled: true } );
		// The label element has the title attribute; we locate it via getByTitle.
		expect( screen.getByTitle( /upgrade/i ) ).toBeInTheDocument();
	} );

	test( 'does not dispatch when a disabled row is clicked', () => {
		renderWith( baseSettings, { experience: 'embedded', disabled: true } );
		fireEvent.click( screen.getByRole( 'radio', { name: /embedded search/i } ) );
		expect( screen.getByRole( 'radio', { name: /embedded search/i } ) ).not.toBeChecked();
	} );
} );

// Action-link branches on the Overlay card — anchor when the card is the
// active (saved) experience, aria-disabled span otherwise. The Customize
// action also drops out entirely on classic-only plans.
describe( '<ExperienceOption> Overlay action links', () => {
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

	test( 'renders Customize and Edit widgets as anchors with the correct hrefs when Overlay is active', () => {
		renderWith( overlayActive, { experience: 'overlay' }, withInstantSearch );
		expect( screen.getByRole( 'link', { name: /customize/i } ) ).toHaveAttribute(
			'href',
			'admin.php?page=jetpack-search-configure'
		);
		expect( screen.getByRole( 'link', { name: /edit widgets/i } ) ).toHaveAttribute(
			'href',
			'widgets.php'
		);
	} );

	test( 'hides Customize action when supports_instant_search is false', () => {
		renderWith( overlayActive, { experience: 'overlay' }, withClassicOnly );
		expect( screen.queryByText( 'Customize' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /edit widgets/i } ) ).toBeInTheDocument();
	} );

	test( 'renders actions as aria-disabled spans (no href) when Overlay is selected but not yet active', () => {
		// Active is 'inline'; pending_experience='overlay' → selected = overlay,
		// active = inline. Actions still render so users see what's coming, but
		// they fall back to a span with aria-disabled so AT users aren't told a
		// non-functional element is a link.
		renderWith(
			{ ...inlineActive, pending_experience: 'overlay' },
			{ experience: 'overlay' },
			withInstantSearch
		);
		expect( screen.queryByRole( 'link', { name: /customize/i } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /edit widgets/i } ) ).not.toBeInTheDocument();
		// The disabled action renders as `<span aria-disabled="true">Customize<span aria-hidden> →</span></span>`,
		// so `getByText('Customize')` lands on the outer wrapper itself (its
		// only direct text node is the linkLabel; the arrow lives in a
		// separate aria-hidden child).
		expect( screen.getByText( 'Customize' ) ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( screen.getByText( 'Edit widgets' ) ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	test( 'actions are aria-disabled while settings are saving', () => {
		renderWith(
			{ ...overlayActive, is_updating: true },
			{ experience: 'overlay' },
			withInstantSearch
		);
		expect( screen.queryByRole( 'link', { name: /customize/i } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /edit widgets/i } ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Customize' ) ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( screen.getByText( 'Edit widgets' ) ).toHaveAttribute( 'aria-disabled', 'true' );
	} );
} );
