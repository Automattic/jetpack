/* eslint-disable testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import { createReduxStore, createRegistry, RegistryProvider } from '@wordpress/data';
import FeatureSelector from '../../../../src/dashboard/components/feature-selector';
import { storeConfig, STORE_ID } from '../../../../src/dashboard/store';

const renderWith = jetpackSettings => {
	const registry = createRegistry();
	const store = createReduxStore( STORE_ID, {
		...storeConfig,
		initialState: { ...( storeConfig.initialState || {} ), jetpackSettings },
	} );
	registry.register( store );
	return render(
		<RegistryProvider value={ registry }>
			<FeatureSelector />
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

describe( '<FeatureSelector>', () => {
	test( 'renders four radio rows in display order', () => {
		renderWith( baseSettings );
		const radios = screen.getAllByRole( 'radio' );
		expect( radios ).toHaveLength( 4 );
		expect( radios[ 0 ] ).toHaveAccessibleName( /embedded search/i );
		expect( radios[ 1 ] ).toHaveAccessibleName( /overlay search/i );
		expect( radios[ 2 ] ).toHaveAccessibleName( /theme search/i );
		expect( radios[ 3 ] ).toHaveAccessibleName( /off/i );
	} );

	test( 'pre-checks the radio that matches the active experience', () => {
		renderWith( baseSettings );
		expect( screen.getByRole( 'radio', { name: /overlay search/i } ) ).toBeChecked();
	} );

	test( 'Save button is aria-disabled while clean', () => {
		renderWith( baseSettings );
		const save = screen.getByRole( 'button', { name: /save/i } );
		expect( save ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	test( 'Save button enables once a different option is selected', () => {
		renderWith( baseSettings );
		fireEvent.click( screen.getByRole( 'radio', { name: /theme search/i } ) );
		const save = screen.getByRole( 'button', { name: /use theme search/i } );
		expect( save ).toHaveAttribute( 'aria-disabled', 'false' );
	} );

	test( 'Save button disables when selection returns to active', () => {
		renderWith( baseSettings );
		fireEvent.click( screen.getByRole( 'radio', { name: /theme search/i } ) );
		fireEvent.click( screen.getByRole( 'radio', { name: /overlay search/i } ) );
		const save = screen.getByRole( 'button', { name: /save/i } );
		expect( save ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	test( 'fieldset has an accessible group name', () => {
		renderWith( baseSettings );
		expect(
			screen.getByRole( 'group', { name: /select a search experience for your visitors/i } )
		).toBeInTheDocument();
	} );

	test( 'disables Embedded and Overlay rows when plan supports only Classic Search', () => {
		const registry = createRegistry();
		const store = createReduxStore( STORE_ID, {
			...storeConfig,
			initialState: {
				...( storeConfig.initialState || {} ),
				jetpackSettings: baseSettings,
				sitePlan: { supports_only_classic_search: true },
			},
		} );
		registry.register( store );
		render(
			<RegistryProvider value={ registry }>
				<FeatureSelector />
			</RegistryProvider>
		);
		expect( screen.getByRole( 'radio', { name: /embedded search/i } ) ).toBeDisabled();
		expect( screen.getByRole( 'radio', { name: /overlay search/i } ) ).toBeDisabled();
		expect( screen.getByRole( 'radio', { name: /theme search/i } ) ).toBeEnabled();
		expect( screen.getByRole( 'radio', { name: /off/i } ) ).toBeEnabled();
	} );

	test( 'hides the Off row on WordPress.com (parity with legacy ModuleControl)', () => {
		const registry = createRegistry();
		const store = createReduxStore( STORE_ID, {
			...storeConfig,
			initialState: {
				...( storeConfig.initialState || {} ),
				jetpackSettings: baseSettings,
				siteData: { isWpcom: true },
			},
		} );
		registry.register( store );
		render(
			<RegistryProvider value={ registry }>
				<FeatureSelector />
			</RegistryProvider>
		);
		const radios = screen.getAllByRole( 'radio' );
		expect( radios ).toHaveLength( 3 );
		expect( screen.getByRole( 'radio', { name: /embedded search/i } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'radio', { name: /overlay search/i } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'radio', { name: /theme search/i } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'radio', { name: /off/i } ) ).not.toBeInTheDocument();
	} );
} );
