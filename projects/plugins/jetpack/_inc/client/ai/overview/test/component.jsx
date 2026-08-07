import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import AiOverview from '../index';

// The usage hook fetches through @wordpress/api-fetch; stub it so nothing
// hits the network and each test controls the response.
jest.mock( '@wordpress/api-fetch' );

afterEach( () => {
	jest.resetAllMocks();
} );

// Payload shapes mirror the wpcom/v2/jetpack-ai/ai-assistant-feature response.
const freePayload = () => ( {
	'requests-count': 12,
	'requests-limit': 20,
	'usage-period': { 'requests-count': 3, 'next-start': '2026-09-01' },
	'current-tier': { value: 0, limit: 20 },
	'next-tier': { value: 100, limit: 100 },
} );

const tieredPayload = () => ( {
	'requests-count': 950,
	'requests-limit': 20,
	'usage-period': { 'requests-count': 340, 'next-start': '2026-09-01' },
	'current-tier': { value: 500, limit: 500, readableLimit: '500' },
	'next-tier': { value: 750, limit: 750 },
} );

const PROPS = {
	activityLogUrl: 'https://example.com/activity',
	upgradeUrl: 'https://example.com/upgrade',
};

// The design-system Notice mirrors its text into a hidden wp.a11y.speak live
// region, so a bare text query matches twice. Ignore that region.
const IGNORE_A11Y = { ignore: 'script, style, .a11y-speak-region' };

describe( 'AiOverview', () => {
	test( 'free tier: renders remaining requests against the free limit per the i4 card', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		// Free sites must get the full view — there is no plan gate. The card
		// counts what is AVAILABLE (limit − used), not what was used.
		await expect( screen.findByText( '8' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( '20' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Available requests' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'progressbar', { name: 'Available requests' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Free' ) ).toBeInTheDocument();
	} );

	test( 'tiered plan: renders remaining period requests against the tier limit', async () => {
		apiFetch.mockResolvedValueOnce( tieredPayload() );

		render( <AiOverview { ...PROPS } /> );

		await expect( screen.findByText( '160' ) ).resolves.toBeInTheDocument();
		// "500" renders twice: the meter's limit and the plan label (the
		// payload has no product name for tiers, so the readable limit
		// stands in — flagged for design).
		expect( screen.getAllByText( '500' ) ).toHaveLength( 2 );
		expect( screen.getByRole( 'progressbar', { name: 'Available requests' } ) ).toBeInTheDocument();
	} );

	test( 'legacy unlimited: full meter, renewal date, no upgrade', async () => {
		apiFetch.mockResolvedValueOnce( { ...tieredPayload(), 'current-tier': { value: 1 } } );

		render( <AiOverview { ...PROPS } /> );

		// The i4 paid card shows UNLIMITED over a full meter, and a renewal
		// date where the free card has the Upgrade button.
		await expect( screen.findByText( 'Unlimited' ) ).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'progressbar', { name: 'Available requests' } ) ).toBeInTheDocument();
		expect( screen.getByText( /Renews on/ ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
	} );

	test( 'upgrade: links to the shared upgrade URL when a next tier exists', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		const upgrade = await screen.findByRole( 'link', { name: 'Upgrade' } );
		expect( upgrade ).toHaveAttribute( 'href', 'https://example.com/upgrade' );
	} );

	test( 'loading: the usage card shows a spinner while docs and activity render immediately', () => {
		// A held promise keeps the usage fetch in flight for the whole test.
		apiFetch.mockReturnValueOnce( new Promise( () => {} ) );

		render( <AiOverview { ...PROPS } /> );

		// The remote usage call must not block the static sections.
		expect( screen.getByRole( 'link', { name: /Activity log/ } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /MCP integration guide/ } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
	} );

	test( 'load failure: the usage card shows an error notice; docs and activity remain', async () => {
		apiFetch.mockRejectedValueOnce( new Error( 'Unable to fetch the requested data.' ) );

		render( <AiOverview { ...PROPS } /> );

		await expect(
			screen.findByText( 'Unable to fetch the requested data.', IGNORE_A11Y )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /Activity log/ } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /API reference/ } ) ).toBeInTheDocument();
	} );

	test( 'activity log: renders as a link to the site activity log', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		const row = await screen.findByRole( 'link', { name: /Activity log/ } );
		expect( row ).toHaveAttribute( 'href', 'https://example.com/activity' );
	} );

	test( 'activity log: absent without an activityLogUrl', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview upgradeUrl={ PROPS.upgradeUrl } /> );

		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: /Activity log/ } ) ).not.toBeInTheDocument();
	} );

	test( 'documentation: renders all five links through the redirect service', async () => {
		apiFetch.mockResolvedValueOnce( freePayload() );

		render( <AiOverview { ...PROPS } /> );

		// Settle the usage fetch so it cannot update state after the test body.
		await expect( screen.findByText( 'Available requests' ) ).resolves.toBeInTheDocument();

		// The i4 docs section is a plain list of external links (no rows).
		const slugByName = {
			'MCP integration guide': 'jetpack-ai-docs-mcp-integration',
			'AI features overview': 'jetpack-ai-docs-features-overview',
			'Setting up agentic workflows': 'jetpack-ai-docs-agentic-workflows',
			'Billing & plans': 'jetpack-ai-docs-billing-plans',
			'API reference': 'jetpack-ai-docs-api-reference',
		};
		for ( const [ name, slug ] of Object.entries( slugByName ) ) {
			const link = screen.getByRole( 'link', { name: new RegExp( name ) } );
			expect( link ).toHaveAttribute( 'href', expect.stringContaining( slug ) );
		}
	} );
} );
