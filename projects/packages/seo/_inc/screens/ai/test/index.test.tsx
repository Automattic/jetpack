import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import type { AiState } from '../../../data/ai-types';
import type { AiForm } from '../../../data/use-ai';

// True ESM (--experimental-vm-modules): mock @wordpress/route before importing
// AiScreen, which calls useNavigate for the "open site visibility" link — the
// same pattern as the sibling dashboard-nav test.
jest.unstable_mockModule( '@wordpress/route', () => ( {
	useNavigate: () => jest.fn(),
} ) );

const { default: AiScreen } = await import( '../index' );

/**
 * Build a GEO-tab form whose llms.txt slice has the given serving state. The tab
 * renders straight from its `form` prop (no store/hooks), so this exercises the
 * honest "can't serve llms.txt" state directly.
 *
 * @param canServe - Whether WordPress can serve /llms.txt on this site.
 * @return A form controller for AiScreen with the enhancer hidden.
 */
const formWith = ( canServe: boolean ): AiForm => ( {
	enhancer: { available: false, enabled: false },
	llmsTxt: { enabled: true, url: 'https://example.com/llms.txt', canServe },
	crawlers: null,
	isSaving: false,
	setEnhancerEnabled: () => {},
	setLlmsTxtEnabled: () => {},
	setCrawlerBlocked: () => {},
	setCrawlerGroupBlocked: () => {},
} );

/**
 * Build a form with crawler controls and selected environment flags.
 *
 * @param flags - Environment flags to override.
 * @return A form controller for AiScreen.
 */
const crawlerForm = (
	flags: Partial<
		Pick<
			NonNullable< AiState[ 'crawlers' ] >,
			'staticRobotsTxt' | 'dataSharingOptOut' | 'pathBasedMultisite'
		>
	> = {}
): AiForm => ( {
	...formWith( true ),
	llmsTxt: null,
	crawlers: {
		catalog: [
			{
				slug: 'gptbot',
				label: 'ChatGPT (OpenAI)',
				userAgent: 'GPTBot',
				type: 'training',
			},
			{
				slug: 'google-extended',
				label: 'Google AI (Gemini)',
				userAgent: 'Google-Extended',
				type: 'mixed',
			},
		],
		overrides: {},
		searchEnginesVisible: true,
		restrictedSubdomain: false,
		staticRobotsTxt: false,
		dataSharingOptOut: false,
		pathBasedMultisite: false,
		...flags,
	},
} );

describe( 'AiScreen (GEO tab) — llms.txt serving state', () => {
	it( 'shows the view link and no warning when llms.txt can be served', () => {
		render( <AiScreen form={ formWith( true ) } /> );

		expect( screen.getByRole( 'link', { name: /view your llms\.txt/i } ) ).toBeInTheDocument();
		expect( screen.queryByText( /can't publish llms\.txt/i ) ).not.toBeInTheDocument();
	} );

	it( 'shows an honest notice and hides the view link when it cannot serve', () => {
		render( <AiScreen form={ formWith( false ) } /> );

		// The @wordpress/ui Notice renders its text in more than one node, so match
		// with getAllByText (see schema-card.test.tsx) rather than getByText.
		expect( screen.getAllByText( /can't publish llms\.txt/i ).length ).toBeGreaterThan( 0 );
		expect(
			screen.queryByRole( 'link', { name: /view your llms\.txt/i } )
		).not.toBeInTheDocument();
	} );
} );

describe( 'AiScreen (GEO tab) — crawler policy state', () => {
	it( 'describes Google-Extended as mixed-use', () => {
		render( <AiScreen form={ crawlerForm() } /> );

		expect( screen.getByText( 'AI answers and training' ) ).toBeInTheDocument();
	} );

	it( 'hides per-bot controls behind the data-sharing opt-out', () => {
		render( <AiScreen form={ crawlerForm( { dataSharingOptOut: true } ) } /> );

		expect( screen.getAllByText( /data sharing opt-out is enabled/i ).length ).toBeGreaterThan( 0 );
		expect( screen.queryByText( 'Google AI (Gemini)' ) ).not.toBeInTheDocument();
	} );

	it( 'hides per-site controls on path-based multisite', () => {
		render( <AiScreen form={ crawlerForm( { pathBasedMultisite: true } ) } /> );

		expect( screen.getAllByText( /shares one robots\.txt/i ).length ).toBeGreaterThan( 0 );
		expect( screen.queryByText( 'Google AI (Gemini)' ) ).not.toBeInTheDocument();
	} );

	it( 'accurately describes a detected static robots.txt file', () => {
		render( <AiScreen form={ crawlerForm( { staticRobotsTxt: true } ) } /> );

		expect(
			screen.getAllByText( /static robots\.txt file in the WordPress installation directory/i )
				.length
		).toBeGreaterThan( 0 );
		expect( screen.queryByText( /can't reach.*robots\.txt/i ) ).not.toBeInTheDocument();
	} );
} );
