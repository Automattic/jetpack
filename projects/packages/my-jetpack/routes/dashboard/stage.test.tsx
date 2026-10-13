import { render, screen } from '@testing-library/react';
import { stage as DashboardStage } from './stage';

jest.mock( '../../_inc/app', () => ( {
	__esModule: true,
	default: () => <div data-testid="my-jetpack-app" />,
} ) );

describe( 'dashboard stage', () => {
	it( 'renders the My Jetpack app', () => {
		render( <DashboardStage /> );

		expect( screen.getByTestId( 'my-jetpack-app' ) ).toBeInTheDocument();
	} );
} );
