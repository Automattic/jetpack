import { render, screen } from '@testing-library/react';
import ThreatSeverityBadge from '../index.tsx';

describe( 'ThreatSeverityBadge', () => {
	it( 'renders the correct severity label', () => {
		render( <ThreatSeverityBadge severity={ 4 } /> );
		expect( screen.getByText( 'High' ) ).toBeInTheDocument();
	} );

	it.each( [ undefined, null ] )( 'renders nothing when the severity is %p', severity => {
		const { container } = render( <ThreatSeverityBadge severity={ severity } /> );
		expect( container ).toBeEmptyDOMElement();
	} );
} );
