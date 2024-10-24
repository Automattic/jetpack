import { render, screen } from '@testing-library/react';
import ThreatSeverityBadge from '..';

describe( 'ThreatSeverityBadge', () => {
	it( 'renders the correct severity label', () => {
		render( <ThreatSeverityBadge severity={ 4 } /> );
		expect( screen.getByText( 'High' ) ).toBeInTheDocument();
	} );
} );
