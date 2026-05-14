/* eslint-disable testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import { createReduxStore, createRegistry, RegistryProvider } from '@wordpress/data';
import ExperienceOption from '../../../../src/dashboard/components/experience-selector/experience-option';
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
		expect(
			screen.getByRole( 'heading', { level: 3, name: /embedded search/i } )
		).toBeInTheDocument();
		expect(
			screen.getByText( /A search-as-you-type customizable search page built with blocks/i )
		).toBeInTheDocument();
	} );

	test( 'shows RECOMMENDED badge only on Embedded', () => {
		const { rerender } = renderWith( baseSettings, { experience: 'embedded' } );
		expect( screen.getByText( 'Recommended' ) ).toBeInTheDocument();

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
		expect( screen.queryByText( 'Recommended' ) ).not.toBeInTheDocument();
	} );

	test( 'shows ACTIVE badge on the active card and no commit button', () => {
		// instant_search_enabled=true → active = 'overlay'
		renderWith( baseSettings, { experience: 'overlay' } );
		expect( screen.getByText( 'Active' ) ).toBeInTheDocument();
		// The active card's action links (Customize / Edit widgets) are the
		// primary CTAs — no commit button to avoid blocking them.
		expect(
			screen.queryByRole( 'button', { name: /^use overlay search$/i } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /^using overlay search$/i } )
		).not.toBeInTheDocument();
	} );

	test( 'non-active cards have no ACTIVE badge and a per-card commit button', () => {
		renderWith( baseSettings, { experience: 'inline' } );
		expect( screen.queryByText( 'Active' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /use theme search/i } ) ).toBeInTheDocument();
	} );

	test( 'commit button is aria-disabled when the card is disabled', () => {
		// `@wordpress/ui` Button uses aria-disabled rather than the native
		// `disabled` attribute, so focus order is preserved on disabled buttons.
		renderWith( baseSettings, { experience: 'embedded', disabled: true } );
		expect( screen.getByRole( 'button', { name: /use embedded search/i } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	test( 'commit → confirm dispatches saveExperience for the card experience', () => {
		// Override the store's `saveExperience` action so we can observe the
		// dispatch and short-circuit the real generator (which would otherwise
		// fetch /wp/v2/settings). The mock has to return a plain action object —
		// Redux middleware refuses undefined.
		const saveExperienceMock = jest.fn( () => ( { type: 'NOOP' } ) );
		const registry = createRegistry();
		const store = createReduxStore( STORE_ID, {
			...storeConfig,
			initialState: { ...( storeConfig.initialState || {} ), jetpackSettings: baseSettings },
			actions: { ...storeConfig.actions, saveExperience: saveExperienceMock },
		} );
		registry.register( store );
		render(
			<RegistryProvider value={ registry }>
				<ExperienceOption experience="inline" />
			</RegistryProvider>
		);
		fireEvent.click( screen.getByRole( 'button', { name: /use theme search/i } ) );
		// Dialog renders a second "Use Theme search" button (the confirm) —
		// the hover-card one is first, confirm is last in DOM order.
		const buttons = screen.getAllByRole( 'button', { name: /use theme search/i } );
		fireEvent.click( buttons[ buttons.length - 1 ] );
		expect( saveExperienceMock ).toHaveBeenCalledWith( 'inline' );
	} );
} );

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
	test( 'renders Customize and Edit widgets as anchors with the correct hrefs when Overlay is active', () => {
		renderWith( overlayActive, { experience: 'overlay' } );
		expect( screen.getByRole( 'link', { name: /customize/i } ) ).toHaveAttribute(
			'href',
			'admin.php?page=jetpack-search-configure'
		);
		expect( screen.getByRole( 'link', { name: /edit widgets/i } ) ).toHaveAttribute(
			'href',
			'widgets.php'
		);
	} );

	test( 'renders actions as aria-disabled spans (no href) when Overlay is not active', () => {
		renderWith( inlineActive, { experience: 'overlay' } );
		expect( screen.queryByRole( 'link', { name: /customize/i } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /edit widgets/i } ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Customize' ) ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( screen.getByText( 'Edit widgets' ) ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	test( 'actions are aria-disabled while settings are saving', () => {
		renderWith( { ...overlayActive, is_updating: true }, { experience: 'overlay' } );
		expect( screen.queryByRole( 'link', { name: /customize/i } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /edit widgets/i } ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Customize' ) ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( screen.getByText( 'Edit widgets' ) ).toHaveAttribute( 'aria-disabled', 'true' );
	} );
} );
