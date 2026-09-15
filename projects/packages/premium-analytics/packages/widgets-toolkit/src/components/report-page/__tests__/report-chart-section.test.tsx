/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { ReportChartSection } from '../report-chart-section';

describe( 'ReportChartSection', () => {
	// jsdom does not honour `inert`, so the attribute itself is what the test reads.
	it( 'makes the collapsed chart inert and lifts it again from the toggle', async () => {
		render(
			<ReportChartSection title="Performance">
				<button type="button">Chart option</button>
			</ReportChartSection>
		);
		const toggle = screen.getByRole( 'button', { name: 'Hide chart' } );
		// eslint-disable-next-line testing-library/no-node-access -- `aria-controls` is the only handle on the inert wrapper.
		const chart = document.getElementById( toggle.getAttribute( 'aria-controls' ) as string );

		expect( chart ).toContainElement( screen.getByRole( 'button', { name: 'Chart option' } ) );
		expect( chart ).not.toHaveAttribute( 'inert' );

		await userEvent.click( screen.getByRole( 'button', { name: 'Hide chart' } ) );

		expect( chart ).toHaveAttribute( 'inert' );
		expect( screen.getByRole( 'button', { name: 'Show chart' } ) ).toHaveAttribute(
			'aria-expanded',
			'false'
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Show chart' } ) );

		expect( chart ).not.toHaveAttribute( 'inert' );
		expect( screen.getByRole( 'button', { name: 'Hide chart' } ) ).toHaveAttribute(
			'aria-expanded',
			'true'
		);
	} );

	it( 'names the collapsed content when the caller says what it is', async () => {
		render(
			<ReportChartSection hideLabel="Hide map" showLabel="Show map">
				<div data-testid="chart" />
			</ReportChartSection>
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Hide map' } ) );

		expect( screen.getByRole( 'button', { name: 'Show map' } ) ).toBeInTheDocument();
	} );

	it( 'puts the info tip behind a trigger named for the chart', async () => {
		render(
			<ReportChartSection title="Views by location" help="Views shaded by country.">
				<div data-testid="chart" />
			</ReportChartSection>
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'About Views by location' } ) );

		await expect( screen.findByText( 'Views shaded by country.' ) ).resolves.toBeInTheDocument();
	} );

	it( 'leaves out the info tip rather than name its trigger "About undefined"', () => {
		render(
			<ReportChartSection help="Views shaded by country.">
				<div data-testid="chart" />
			</ReportChartSection>
		);

		expect( screen.queryByRole( 'button', { name: /^About/ } ) ).not.toBeInTheDocument();
	} );
} );
