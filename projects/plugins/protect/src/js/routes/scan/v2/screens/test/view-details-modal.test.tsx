import { render, screen } from '@testing-library/react';
import { ViewDetailsModal } from '../view-details-modal';
import type { Threat } from '../../data/types';

jest.mock( '@automattic/jetpack-scan', () => ( {
	ThreatSeverityBadge: ( { severity }: { severity: number } ) => (
		<span data-testid="severity-badge">{ severity }</span>
	),
} ) );
jest.mock( '@wordpress/date', () => ( {
	dateI18n: ( _format: string, value: string ) => value,
} ) );

const baseThreat: Threat = {
	id: 7,
	title: 'Vulnerable plugin',
	description: 'Remote-code-execution risk in the plugin.',
	severity: 8,
	signature: 'jetpack-test-signature',
	status: 'current',
};

describe( 'ViewDetailsModal', () => {
	it( 'renders the title, severity badge, signature, and description read-only', () => {
		render( <ViewDetailsModal items={ [ baseThreat ] } /> );
		expect( screen.getByText( 'Vulnerable plugin' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'severity-badge' ) ).toHaveTextContent( '8' );
		expect( screen.getByText( 'jetpack-test-signature' ) ).toBeInTheDocument();
		expect( screen.getByText( /remote-code-execution risk/i ) ).toBeInTheDocument();
		// View modal is read-only — no buttons rendered.
		expect( screen.queryAllByRole( 'button' ) ).toHaveLength( 0 );
	} );

	it( 'omits the "Fixed on" row when the threat is not fixed', () => {
		render(
			<ViewDetailsModal
				items={ [ { ...baseThreat, status: 'current', fixedOn: '2026-01-01T00:00:00.000Z' } ] }
			/>
		);
		expect( screen.queryByText( /fixed on/i ) ).not.toBeInTheDocument();
	} );

	it( 'renders the "Fixed on" row when the threat is fixed', () => {
		render(
			<ViewDetailsModal
				items={ [ { ...baseThreat, status: 'fixed', fixedOn: '2026-02-15T00:00:00.000Z' } ] }
			/>
		);
		expect( screen.getByText( /fixed on/i ) ).toBeInTheDocument();
		expect( screen.getByText( '2026-02-15T00:00:00.000Z' ) ).toBeInTheDocument();
	} );
} );
