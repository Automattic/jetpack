/**
 * External dependencies
 */
import { WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { EmailsLeaderboard, type EmailRow } from '../render';
import type { EmailMetric } from '../widget';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const rows: EmailRow[] = [
	{
		id: 12,
		postId: 12,
		link: 'https://example.com/newsletter/',
		label: 'Monthly newsletter',
		opensRate: 42,
		clicksRate: 7,
	},
];

function renderLeaderboard( metric: EmailMetric ) {
	return render(
		<WidgetRoot
			attributes={ {
				reportParams: { from: '2026-06-01', to: '2026-06-30' },
			} }
		>
			<EmailsLeaderboard rows={ rows } metric={ metric } />
		</WidgetRoot>
	);
}

describe( 'EmailsLeaderboard', () => {
	it.each( [
		[ 'opens', 'email-opens' ],
		[ 'clicks', 'email-clicks' ],
	] as const )( 'opens the matching detail tab for the %s metric', ( metric, expectedSection ) => {
		renderLeaderboard( metric );

		const link = screen.getByRole( 'link', { name: 'Monthly newsletter' } );
		const url = new URL( link.getAttribute( 'href' ) ?? '', 'https://example.com' );

		expect( url.pathname ).toBe( '/post/12' );
		expect( url.searchParams.get( 'from' ) ).toBe( '2026-06-01' );
		expect( url.searchParams.get( 'section' ) ).toBe( expectedSection );
		expect( url.searchParams.get( 'post_url' ) ).toBe( 'https://example.com/newsletter/' );
	} );
} );
