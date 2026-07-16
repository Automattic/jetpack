import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import AiScreen from '../index';
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
	isSaving: false,
	setEnhancerEnabled: () => {},
	setLlmsTxtEnabled: () => {},
} );

describe( 'AiScreen (GEO tab) — llms.txt serving state', () => {
	it( 'shows the view link and no warning when llms.txt can be served', () => {
		render( <AiScreen form={ formWith( true ) } /> );

		expect( screen.getByRole( 'link', { name: /view your llms\.txt/i } ) ).toBeInTheDocument();
		expect( screen.queryByText( /can't publish llms\.txt/i ) ).not.toBeInTheDocument();
	} );

	it( 'shows an honest notice and hides the view link when it cannot serve', () => {
		render( <AiScreen form={ formWith( false ) } /> );

		expect( screen.getByText( /can't publish llms\.txt/i ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: /view your llms\.txt/i } )
		).not.toBeInTheDocument();
	} );
} );
