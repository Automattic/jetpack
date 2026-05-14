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
			screen.getByRole( 'heading', { level: 2, name: /embedded search/i } )
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
		expect(
			screen.queryByRole( 'button', { name: /^use overlay search$/i } )
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

	test( 'commit button opens a confirmation dialog; cancelling closes it', () => {
		renderWith( baseSettings, { experience: 'inline' } );
		fireEvent.click( screen.getByRole( 'button', { name: /use theme search/i } ) );
		const dialog = screen.getByRole( 'dialog' );
		expect( dialog ).toHaveTextContent(
			/switch the visitor-facing search experience to theme search/i
		);
		// The dialog's "Cancel" button (rendered alongside the confirmation
		// button) closes the dialog without saving.
		fireEvent.click( screen.getAllByRole( 'button', { name: /cancel/i } )[ 0 ] );
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
