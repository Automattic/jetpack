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
	it( 'takes the chart out of the accessibility tree and back from the toggle', async () => {
		render(
			<ReportChartSection title="Performance">
				<button type="button">Chart option</button>
			</ReportChartSection>
		);

		expect( screen.getByRole( 'button', { name: 'Chart option' } ) ).toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Hide chart' } ) );

		expect( screen.queryByRole( 'button', { name: 'Chart option' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Show chart' } ) ).toHaveAttribute(
			'aria-expanded',
			'false'
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Show chart' } ) );

		expect( screen.getByRole( 'button', { name: 'Chart option' } ) ).toBeInTheDocument();
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
