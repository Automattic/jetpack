import { render, screen } from '@testing-library/react';
import { KnownThreatsBadgeWithWarning } from '../src/dashboard/components/known-threats/badge';

describe( 'KnownThreatsBadgeWithWarning', () => {
	it( 'gives screen readers the warning the tooltip shows', () => {
		render( <KnownThreatsBadgeWithWarning count={ 3 } /> );

		expect( screen.getByText( 'Known threats (3)' ) ).toBeVisible();
		expect(
			screen.getByText(
				'This backup is known to contain 3 security threats. Restoring it may bring malware back to your site.'
			)
		).toBeInTheDocument();
	} );
} );
