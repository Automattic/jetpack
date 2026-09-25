import { render, screen } from '@testing-library/react';
import DashboardLayout from '../index';
import type { ReactNode } from 'react';

jest.mock( '../../gates', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) => <>{ children }</>,
} ) );
jest.mock( '@automattic/jetpack-components/jetpack-footer', () => ( {
	__esModule: true,
	default: () => null,
} ) );
jest.mock( '@automattic/jetpack-components/jetpack-logo', () => ( {
	__esModule: true,
	default: () => null,
} ) );
jest.mock( '@automattic/jetpack-components/jitm-slot', () => ( {
	__esModule: true,
	default: () => null,
} ) );

const mockConnectionError = jest.fn();
jest.mock( '@automattic/jetpack-connection/use-connection-error-notice', () => ( {
	__esModule: true,
	ConnectionError: ( props: { trackingContext?: string } ) => mockConnectionError( props ),
} ) );

describe( 'DashboardLayout', () => {
	beforeEach( () => {
		mockConnectionError.mockReset();
	} );

	it( 'reports connection errors above the gated dashboard body', () => {
		mockConnectionError.mockImplementation( ( { trackingContext } ) => (
			<div data-testid="connection-error" data-tracking-context={ trackingContext } />
		) );

		render(
			<DashboardLayout>
				<div data-testid="dashboard-body" />
			</DashboardLayout>
		);

		const connectionError = screen.getByTestId( 'connection-error' );
		expect( connectionError ).toHaveAttribute( 'data-tracking-context', 'backup' );
		// The wrapper class carries the banners' spacing; RTL has no query for it.
		// eslint-disable-next-line testing-library/no-node-access
		expect( connectionError.closest( '.jpb-connection-error' ) ).not.toBeNull();
		// `Gates` is mocked to render its children directly, so DOM order is
		// source order: this fails if the notice moves inside the gate,
		// where a takeover screen would hide it along with everything else.
		expect(
			connectionError.compareDocumentPosition( screen.getByTestId( 'dashboard-body' ) )
		).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
	} );

	it( 'collapses the wrapper when there is no connection error', () => {
		mockConnectionError.mockReturnValue( null );

		const { container } = render(
			<DashboardLayout>
				<div data-testid="dashboard-body" />
			</DashboardLayout>
		);

		// No RTL query targets a class with no accessible role or text.
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( '.jpb-connection-error' ) ).toBeEmptyDOMElement();
	} );
} );
