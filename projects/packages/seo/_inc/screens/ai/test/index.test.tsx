import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import AiScreen from '../index';
import type { AiState } from '../../../data/ai-types';
import type { AiForm } from '../../../data/use-ai';

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
				slug: 'oai-searchbot',
				label: 'ChatGPT Search (OAI-SearchBot)',
				userAgent: 'OAI-SearchBot',
				type: 'answer',
			},
			{
				slug: 'gptbot',
				label: 'ChatGPT (GPTBot)',
				userAgent: 'GPTBot',
				type: 'training',
			},
			{
				slug: 'google-extended',
				label: 'Google Gemini (Google-Extended)',
				userAgent: 'Google-Extended',
				type: 'training',
			},
		],
		overrides: {},
		searchEnginesVisible: true,
		restrictedSubdomain: false,
		staticRobotsTxt: false,
		dataSharingOptOut: false,
		pathBasedMultisite: false,
		privacySettingsUrl: 'http://example.com/wp-admin/options-reading.php',
		...flags,
	},
} );

const noop = () => {};

describe( 'AiScreen (GEO tab) — llms.txt serving state', () => {
	it( 'shows the view link and no warning when llms.txt can be served', () => {
		render(
			<AiScreen form={ formWith( true ) } searchEnginesVisible onManageVisibility={ noop } />
		);

		expect( screen.getByRole( 'link', { name: /view your llms\.txt/i } ) ).toBeInTheDocument();
		expect( screen.queryByText( /can't publish llms\.txt/i ) ).not.toBeInTheDocument();
	} );

	it( 'shows an honest notice and hides the view link when it cannot serve', () => {
		render(
			<AiScreen form={ formWith( false ) } searchEnginesVisible onManageVisibility={ noop } />
		);

		// The @wordpress/ui Notice renders its text in more than one node, so match
		// with getAllByText (see schema-card.test.tsx) rather than getByText.
		expect( screen.getAllByText( /can't publish llms\.txt/i ).length ).toBeGreaterThan( 0 );
		expect(
			screen.queryByRole( 'link', { name: /view your llms\.txt/i } )
		).not.toBeInTheDocument();
	} );

	it( 'disables llms.txt and links to visibility settings when indexing is blocked', () => {
		const onManageVisibility = jest.fn();
		render(
			<AiScreen
				form={ formWith( true ) }
				searchEnginesVisible={ false }
				onManageVisibility={ onManageVisibility }
			/>
		);

		expect(
			screen.getByRole( 'checkbox', { name: /generate an llms\.txt file/i } )
		).toBeDisabled();
		expect(
			screen.getByRole( 'checkbox', { name: /generate an llms\.txt file/i } )
		).not.toBeChecked();
		expect( screen.getAllByText( /to enable, allow search engines/i ).length ).toBeGreaterThan( 0 );
		expect( screen.getByText( 'Disabled' ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: /view your llms\.txt/i } )
		).not.toBeInTheDocument();

		// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep for a single click.
		fireEvent.click( screen.getByRole( 'button', { name: /settings/i } ) );
		expect( onManageVisibility ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe( 'AiScreen (GEO tab) — crawler policy state', () => {
	it( 'files Google-Extended under Training, not its own module', () => {
		render( <AiScreen form={ crawlerForm() } searchEnginesVisible onManageVisibility={ noop } /> );

		expect( screen.getByText( 'Training crawlers' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Google Gemini (Google-Extended)' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'AI answers and training' ) ).not.toBeInTheDocument();
	} );

	it( 'disables the crawler controls and links to the setting under the data-sharing opt-out', () => {
		render(
			<AiScreen
				form={ crawlerForm( { dataSharingOptOut: true } ) }
				searchEnginesVisible
				onManageVisibility={ noop }
			/>
		);

		// The modules stay visible so the user can see what's here...
		expect( screen.getByText( 'Google Gemini (Google-Extended)' ) ).toBeInTheDocument();
		// ...with an explanation and a link to the governing setting...
		expect( screen.getAllByText( /third-party sharing is turned off/i ).length ).toBeGreaterThan(
			0
		);
		const link = screen.getAllByRole( 'link', { name: /manage sharing settings/i } )[ 0 ];
		expect( link ).toHaveAttribute( 'href', 'http://example.com/wp-admin/options-reading.php' );
		// ...and the toggles disabled.
		expect( screen.getAllByRole( 'checkbox' ).every( box => box.hasAttribute( 'disabled' ) ) ).toBe(
			true
		);
	} );

	it( 'hides per-site controls on path-based multisite', () => {
		render(
			<AiScreen
				form={ crawlerForm( { pathBasedMultisite: true } ) }
				searchEnginesVisible
				onManageVisibility={ noop }
			/>
		);

		expect( screen.getAllByText( /shares one robots\.txt/i ).length ).toBeGreaterThan( 0 );
		expect( screen.queryByText( 'Google Gemini (Google-Extended)' ) ).not.toBeInTheDocument();
	} );

	it( 'accurately describes a detected static robots.txt file', () => {
		render(
			<AiScreen
				form={ crawlerForm( { staticRobotsTxt: true } ) }
				searchEnginesVisible
				onManageVisibility={ noop }
			/>
		);

		expect(
			screen.getAllByText( /static robots\.txt file in the WordPress installation directory/i )
				.length
		).toBeGreaterThan( 0 );
		expect( screen.queryByText( /can't reach.*robots\.txt/i ) ).not.toBeInTheDocument();
	} );
} );
