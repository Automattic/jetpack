import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { reloadPage } from '../../products/reload-page';
import { FeaturesEmptyState } from '../empty-state';

jest.mock( '../../products/reload-page', () => ( { reloadPage: jest.fn() } ) );

const props = {
	search: '',
	filter: 'all' as const,
	hasCatalog: true,
	onClearSearch: jest.fn(),
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

	it( 'clears the search from the failed search state', async () => {
		render( <FeaturesEmptyState { ...props } search="bakcup" /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Clear search' } ) );

		expect( props.onClearSearch ).toHaveBeenCalled();
	} );

	it( 'sends someone with nothing active to the whole list', async () => {
		render( <FeaturesEmptyState { ...props } filter="active" /> );

		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'No features are active yet.' );

		await userEvent.click( screen.getByRole( 'button', { name: 'Browse all features' } ) );

		expect( props.onFilterChange ).toHaveBeenCalledWith( 'all' );
	} );

	it( 'says so when there is nothing left to turn on', async () => {
		render( <FeaturesEmptyState { ...props } filter="inactive" /> );

		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'Everything is turned on.' );

		await userEvent.click( screen.getByRole( 'button', { name: 'View active features' } ) );

		expect( props.onFilterChange ).toHaveBeenCalledWith( 'active' );
	} );

	it( 'reports a catalog that never arrived as a failure, not as an empty site', async () => {
		render( <FeaturesEmptyState { ...props } hasCatalog={ false } /> );

		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'We couldn’t load your features.' );

		await userEvent.click( screen.getByRole( 'button', { name: 'Reload' } ) );

		expect( reloadPage ).toHaveBeenCalled();
	} );

	it( 'blames the missing catalog, not the search term, when both are in play', () => {
		render( <FeaturesEmptyState { ...props } hasCatalog={ false } search="backup" /> );

		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'We couldn’t load your features.' );
	} );

	it( 'marks the filter states with the Jetpack logo', () => {
		const { rerender } = render( <FeaturesEmptyState { ...props } filter="active" /> );

		expect( screen.getByRole( 'img', { name: 'Jetpack Logo' } ) ).toBeInTheDocument();

		rerender( <FeaturesEmptyState { ...props } filter="inactive" /> );

		expect( screen.getByRole( 'img', { name: 'Jetpack Logo' } ) ).toBeInTheDocument();
	} );

	it( 'keeps the logo off the failed search, which gets its own icon', () => {
		render( <FeaturesEmptyState { ...props } search="bakcup" /> );

		expect( screen.queryByRole( 'img', { name: 'Jetpack Logo' } ) ).not.toBeInTheDocument();
	} );

	it( 'falls back to a plain heading for a plan filter that matched nothing', () => {
		render( <FeaturesEmptyState { ...props } filter="growth" /> );

		expect( screen.getByRole( 'heading' ) ).toHaveTextContent( 'No features found.' );
	} );
} );
