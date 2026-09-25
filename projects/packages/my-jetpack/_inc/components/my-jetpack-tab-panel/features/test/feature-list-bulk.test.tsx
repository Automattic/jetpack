import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import useAnalytics from '../../../../hooks/use-analytics';
import { FeaturesTrackingProvider } from '../features-tracking-context';
import { SelectionHarness } from './helpers/selection-harness';
import type { FeatureState } from '../feature-state';
import type { ReactNode } from 'react';

const mockSuccess = jest.fn();

jest.mock( '@wordpress/api-fetch' );
jest.mock( '../../../../hooks/use-analytics' );

const recordEvent = jest.fn();
const bulkEvent = () =>
	recordEvent.mock.calls
		.filter( ( [ name ] ) => name === 'jetpack_myjetpack_features_bulk_action' )
		.at( -1 )?.[ 1 ];

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

const renderTracked = ( states: FeatureState[] ) =>
	render(
		<QueryClientProvider client={ new QueryClient() }>
			<FeaturesTrackingProvider filter="all" search="" view="list">
				<SelectionHarness states={ states } />
			</FeaturesTrackingProvider>
		</QueryClientProvider>
	);

beforeEach( () => {
	jest.clearAllMocks();
	( useAnalytics as jest.MockedFunction< typeof useAnalytics > ).mockReturnValue( { recordEvent } );
} );

const pluginState = ( slug: string ) =>
	( {
		feature: { slug, name: slug },
		status: 'inactive',
		control: { kind: 'plugin', plugin: slug },
	} ) as FeatureState;

const moduleState = ( slug: string ) =>
	( {
		feature: { slug, name: slug },
		status: 'inactive',
		control: { kind: 'module', module: { module: slug, name: slug, override: false } },
	} ) as unknown as FeatureState;

describe( 'FeatureList with the bulk switch', () => {
	it( 'sends the selected features in one request and clears the selection after it', async () => {
		mockApiFetch.mockResolvedValue( { state: {}, failed: [] } );

		render(
			<QueryClientProvider client={ new QueryClient() }>
				<SelectionHarness
					states={ [ pluginState( 'akismet' ), pluginState( 'boost' ), pluginState( 'crm' ) ] }
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

	it( 'renders groups under their headings and switches both lists from the one bar', async () => {
		mockApiFetch.mockResolvedValue( { state: {}, failed: [] } );

		render(
			<QueryClientProvider client={ new QueryClient() }>
				<SelectionHarness
					states={ [ pluginState( 'akismet' ) ] }
					groups={ [
						{ label: 'Security', states: [ moduleState( 'monitor' ) ] },
						{ label: 'Writing', states: [ moduleState( 'markdown' ) ] },
					] }
				/>
			</QueryClientProvider>
		);

		expect( screen.getByRole( 'heading', { name: 'Security' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'heading', { name: 'Writing' } ) ).toBeInTheDocument();
		// One bar over both lists, not one each.
		expect( screen.getAllByRole( 'checkbox', { name: 'Select all features' } ) ).toHaveLength( 1 );

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Select all features' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Activate' } ) );

		await waitFor( () => expect( mockSuccess ).toHaveBeenCalledWith( '3 features activated.' ) );
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				data: { active: true, modules: [ 'monitor', 'markdown' ], plugins: [ 'akismet' ] },
			} )
		);
	} );
	it( 'reports what the run switched, counted against what it sent', async () => {
		mockApiFetch.mockResolvedValue( { state: {}, failed: [] } );

		renderTracked( [ pluginState( 'akismet' ), pluginState( 'boost' ), pluginState( 'crm' ) ] );

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Select akismet' } ) );
		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Select boost' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Activate' } ) );

		await waitFor( () => expect( bulkEvent() ).toBeDefined() );
		expect( bulkEvent() ).toMatchObject( {
			action: 'activate',
			attempted: 2,
			succeeded: 2,
			failed: 0,
			view: 'list',
		} );
		expect( bulkEvent() ).not.toHaveProperty( 'failed_slugs' );
	} );

	it( 'names the features a run could not switch, and leaves them out of the total', async () => {
		mockApiFetch.mockResolvedValue( {
			state: {},
			failed: [ { type: 'plugin', slug: 'boost', message: 'Nope.' } ],
		} );

		renderTracked( [ pluginState( 'akismet' ), pluginState( 'boost' ) ] );

		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Select akismet' } ) );
		await userEvent.click( screen.getByRole( 'checkbox', { name: 'Select boost' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Activate' } ) );

		await waitFor( () => expect( bulkEvent() ).toBeDefined() );
		expect( bulkEvent() ).toMatchObject( {
			attempted: 2,
			succeeded: 1,
			failed: 1,
			failed_slugs: 'boost',
		} );
	} );
} );
