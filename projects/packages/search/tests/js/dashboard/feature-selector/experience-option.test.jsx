/* eslint-disable testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import { createReduxStore, createRegistry, RegistryProvider } from '@wordpress/data';
import ExperienceOption from '../../../../src/dashboard/components/feature-selector/experience-option';
import { storeConfig, STORE_ID } from '../../../../src/dashboard/store';

const renderWith = ( jetpackSettings, props ) => {
	const registry = createRegistry();
	const store = createReduxStore( STORE_ID, {
		...storeConfig,
		initialState: { ...( storeConfig.initialState || {} ), jetpackSettings },
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
		expect(
			screen.getByText( 'A search-as-you-type customizable search page built with blocks.' )
		).toBeInTheDocument();
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
		renderWith( baseSettings, { experience: 'classic' } );
		expect( screen.queryByLabelText( 'Active' ) ).not.toBeInTheDocument();
	} );

	test( 'radio is checked when experience matches selected', () => {
		renderWith( { ...baseSettings, pending_experience: 'classic' }, { experience: 'classic' } );
		expect( screen.getByRole( 'radio', { name: /theme search/i } ) ).toBeChecked();
	} );

	test( 'clicking the row dispatches setPendingExperience', () => {
		renderWith( baseSettings, { experience: 'classic' } );
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
