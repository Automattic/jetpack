import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { reloadPage } from '../../products/reload-page';
import { FeaturesEmptyState } from '../empty-state';

jest.mock( '../../products/reload-page', () => ( { reloadPage: jest.fn() } ) );

const props = {
	search: '',
	filter: 'all' as const,
	hasCatalog: true,
	onFilterChange: jest.fn(),
};

describe( 'FeaturesEmptyState', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'names the term that matched nothing', () => {
		render( <FeaturesEmptyState { ...props } search="bakcup" /> );

		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'No features match “bakcup”.' );
	} );

	it( 'offers a jetpack.com support search for the term', () => {
		render( <FeaturesEmptyState { ...props } search="bakcup" /> );

		const link = screen.getByRole( 'link', { name: /Search jetpack.com for “bakcup”/ } );

		expect( link ).toHaveAttribute( 'href', expect.stringContaining( 'source=jetpack-support' ) );
		expect( link ).toHaveAttribute( 'href', expect.stringContaining( 'bakcup' ) );
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'leaves the failed search with the link alone, and no buttons', () => {
		render( <FeaturesEmptyState { ...props } search="bakcup" /> );

		expect( screen.queryAllByRole( 'button' ) ).toHaveLength( 0 );
	} );

	it( 'sends someone with nothing active to the whole list', async () => {
		render( <FeaturesEmptyState { ...props } filter="active" /> );

		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'No features are active yet.' );

		await userEvent.click( screen.getByRole( 'button', { name: 'Explore all' } ) );

		expect( props.onFilterChange ).toHaveBeenCalledWith( 'all' );
	} );

	it( 'says so when there is nothing left to turn on', async () => {
		render( <FeaturesEmptyState { ...props } filter="inactive" /> );

		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'Everything is turned on.' );

		await userEvent.click( screen.getByRole( 'button', { name: 'Explore all' } ) );

		expect( props.onFilterChange ).toHaveBeenCalledWith( 'all' );
	} );

	it( 'reports a catalog that never arrived as a failure, not as an empty site', async () => {
		render( <FeaturesEmptyState { ...props } hasCatalog={ false } /> );

		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'We couldn’t load your features.' );

		await userEvent.click( screen.getByRole( 'button', { name: 'Reload' } ) );

		// Deferred a beat, so the click's Tracks pixel is not cancelled by the reload.
		await waitFor( () => expect( reloadPage ).toHaveBeenCalled() );
	} );

	it( 'blames the missing catalog, not the search term, when both are in play', () => {
		render( <FeaturesEmptyState { ...props } hasCatalog={ false } search="backup" /> );

		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'We couldn’t load your features.' );
	} );

	it( 'ignores a term of whitespace, which the grid does not treat as a search', () => {
		render( <FeaturesEmptyState { ...props } search="   " filter="active" /> );

		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'No features are active yet.' );
	} );

	it( 'falls back to a plain heading for a plan filter that matched nothing', () => {
		render( <FeaturesEmptyState { ...props } filter="growth" /> );

		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'No features found.' );
	} );
} );
