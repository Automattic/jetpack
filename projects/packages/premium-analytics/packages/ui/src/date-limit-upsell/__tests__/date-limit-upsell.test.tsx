import { render, screen } from '@testing-library/react';
import { DateLimitUpsell } from '../date-limit-upsell';

const LINKS = { supportUrl: 'https://example.com/help', upgradeUrl: 'https://example.com/plans' };

describe( 'DateLimitUpsell', () => {
	it( 'links the copy that carries a link tag', () => {
		render(
			<DateLimitUpsell upsell={ { description: 'See <link>what is included</link>.', ...LINKS } } />
		);

		expect( screen.getByRole( 'link', { name: /what is included/ } ) ).toHaveAttribute(
			'href',
			LINKS.supportUrl
		);
		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toHaveAttribute(
			'href',
			LINKS.upgradeUrl
		);
	} );
} );
