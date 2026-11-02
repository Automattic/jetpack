import restApi from '@automattic/jetpack-api';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import AdminPage from '../index.tsx';

const pageAction = <button>Page action</button>;
const globalControl = <button>Global control</button>;

describe( 'AdminPage', () => {
	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it.each( [
		[ 'page actions, a separator, then global controls', pageAction, globalControl, 1 ],
		[ 'global controls alone, without a separator', null, globalControl, 0 ],
		[ 'page actions alone, as before', pageAction, undefined, 0 ],
	] )( 'renders %s', ( _, actions, globalControls, separators ) => {
		render(
			<AdminPage
				title="Jetpack"
				actions={ actions }
				globalControls={ globalControls }
				showFooter={ false }
			>
				Content
			</AdminPage>
		);

		const expected = [ actions && 'Page action', globalControls && 'Global control' ].filter(
			Boolean
		);
		const buttons = screen.getAllByRole( 'button', { name: /Page action|Global control/ } );

		expect( buttons.map( button => button.textContent ) ).toEqual( expected );
		expect( screen.queryAllByRole( 'separator' ) ).toHaveLength( separators );
	} );

	it( 'names the page region from the aria label when breadcrumbs replace the title', () => {
		render(
			<AdminPage breadcrumbs={ <nav /> } ariaLabel="Protect" showFooter={ false }>
				Content
			</AdminPage>
		);

		expect( screen.getByRole( 'region', { name: 'Protect' } ) ).toBeInTheDocument();
	} );

	it( 'leaves the shared REST client alone when no API root or nonce is passed', () => {
		const setApiRoot = jest.spyOn( restApi, 'setApiRoot' );
		const setApiNonce = jest.spyOn( restApi, 'setApiNonce' );

		render( <AdminPage title="Test">content</AdminPage> );

		expect( setApiRoot ).not.toHaveBeenCalled();
		expect( setApiNonce ).not.toHaveBeenCalled();
	} );

	it( 'sets the API root and nonce it is given', () => {
		const setApiRoot = jest.spyOn( restApi, 'setApiRoot' );
		const setApiNonce = jest.spyOn( restApi, 'setApiNonce' );

		render(
			<AdminPage title="Test" apiRoot="https://example.com/wp-json/" apiNonce="nonce">
				content
			</AdminPage>
		);

		expect( setApiRoot ).toHaveBeenCalledWith( 'https://example.com/wp-json/' );
		expect( setApiNonce ).toHaveBeenCalledWith( 'nonce' );
	} );
} );
