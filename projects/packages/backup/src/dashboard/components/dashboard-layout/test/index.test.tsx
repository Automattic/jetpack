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
jest.mock( '@automattic/jetpack-connection/use-connection-error-notice', () => ( {
	__esModule: true,
	ConnectionError: ( { trackingContext }: { trackingContext?: string } ) => (
		<div data-testid="connection-error" data-tracking-context={ trackingContext } />
	),
} ) );

describe( 'DashboardLayout', () => {
	it( 'reports connection errors above the gated dashboard body', () => {
		render(
			<DashboardLayout>
				<div data-testid="dashboard-body" />
			</DashboardLayout>
		);

		const connectionError = screen.getByTestId( 'connection-error' );
		expect( connectionError ).toHaveAttribute( 'data-tracking-context', 'backup' );
		// `Gates` is mocked to render its children directly, so DOM order is
		// source order: this fails if the notice moves inside the gate,
		// where a takeover screen would hide it along with everything else.
		expect(
			connectionError.compareDocumentPosition( screen.getByTestId( 'dashboard-body' ) )
		).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
	} );
} );
