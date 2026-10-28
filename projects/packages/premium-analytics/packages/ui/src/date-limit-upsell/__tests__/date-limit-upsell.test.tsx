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

	it.each( [
		{ emptied: 'supportUrl', kept: /^Upgrade$/ },
		{ emptied: 'upgradeUrl', kept: /what is included/ },
	] )( 'keeps the copy but drops the link of an empty $emptied', ( { emptied, kept } ) => {
		render(
			<DateLimitUpsell
				upsell={ { description: 'See <link>what is included</link>.', ...LINKS, [ emptied ]: '' } }
			/>
		);

		expect( screen.getByText( /what is included/ ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link' ) ).toHaveAccessibleName( kept );
	} );
} );
