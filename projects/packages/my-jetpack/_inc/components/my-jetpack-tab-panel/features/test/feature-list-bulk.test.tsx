import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { FeatureList } from '../feature-list';
import type { FeatureState } from '../feature-state';
import type { ReactNode } from 'react';

const mockSuccess = jest.fn();

jest.mock( '@wordpress/api-fetch' );

jest.mock( '@automattic/jetpack-components', () => ( {
	useGlobalNotices: () => ( { createSuccessNotice: mockSuccess, createErrorNotice: jest.fn() } ),
} ) );

jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: 'modules-store' } ) );

// A proxy rather than a spread: the real module's exports are read lazily, since spreading it
// here copies them before its circular imports have settled.
jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const useDispatch = () => ( { fetchModules: () => Promise.resolve( true ) } );
	return new Proxy( actual, {
		get: ( target, key ) => ( key === 'useDispatch' ? useDispatch : target[ key ] ),
	} );
} );

jest.mock( '../feature-item', () => ( {
	FeatureItem: ( { state, leading }: { state: FeatureState; leading: ReactNode } ) => (
		<div>
			{ leading }
			{ state.feature.name }
		</div>
	),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const pluginState = ( slug: string ) =>
	( {
		feature: { slug, name: slug },
		status: 'inactive',
		control: { kind: 'plugin', plugin: slug },
	} ) as FeatureState;

describe( 'FeatureList with the bulk switch', () => {
	it( 'sends the selected features in one request and clears the selection after it', async () => {
		mockApiFetch.mockResolvedValue( { state: {}, failed: [] } );

		render(
			<QueryClientProvider client={ new QueryClient() }>
				<FeatureList
					states={ [ pluginState( 'akismet' ), pluginState( 'boost' ), pluginState( 'crm' ) ] }
					onOpen={ jest.fn() }
				/>
			</QueryClientProvider>
		);

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Select akismet' } ) );
		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Select boost' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Activate' } ) );

		await waitFor( () => expect( mockSuccess ).toHaveBeenCalledWith( '2 features activated.' ) );
		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				data: { active: true, modules: [], plugins: [ 'akismet', 'boost' ] },
			} )
		);
		expect( screen.getByRole( 'checkbox', { name: 'Select akismet' } ) ).not.toBeChecked();
	} );
} );
