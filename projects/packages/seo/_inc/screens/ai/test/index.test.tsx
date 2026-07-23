import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
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
		expect( screen.getAllByText( /to enable llms\.txt/i ).length ).toBeGreaterThan( 0 );
		expect( screen.getByText( 'Disabled' ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: /view your llms\.txt/i } )
		).not.toBeInTheDocument();

		// eslint-disable-next-line testing-library/prefer-user-event -- fireEvent keeps this off the @testing-library/user-event devDep for a single click.
		fireEvent.click( screen.getByRole( 'button', { name: /manage site visibility/i } ) );
		expect( onManageVisibility ).toHaveBeenCalledTimes( 1 );
	} );
} );
