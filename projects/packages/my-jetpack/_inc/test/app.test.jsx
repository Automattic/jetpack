import { render, screen } from '@testing-library/react';
import App from '../app';

jest.mock( '../components/my-jetpack-screen', () => ( {
	__esModule: true,
	default: () => <div data-testid="my-jetpack-screen" />,
} ) );

describe( 'App', () => {
	// jsdom doesn't implement scrollTo; ScrollToTop calls it on mount.
	beforeEach( () => {
		window.scrollTo = () => {};
	} );

	it( 'renders the home screen at the default hash route', () => {
		window.location.hash = '';

		render( <App /> );

		expect( screen.getByTestId( 'my-jetpack-screen' ) ).toBeInTheDocument();
	} );

	it( 'renders the home screen for an unknown hash route', () => {
		window.location.hash = '#/not-a-real-route';

		render( <App /> );

		expect( screen.getByTestId( 'my-jetpack-screen' ) ).toBeInTheDocument();
	} );
} );
