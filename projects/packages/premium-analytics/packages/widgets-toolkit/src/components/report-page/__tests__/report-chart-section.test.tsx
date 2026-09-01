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
	it( 'collapses and restores the chart from the footer control', async () => {
		render(
			<ReportChartSection title="Performance">
				<div data-testid="chart" />
			</ReportChartSection>
		);

		expect( screen.getByTestId( 'chart' ) ).toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Hide chart' } ) );

		expect( screen.queryByTestId( 'chart' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'heading', { name: 'Performance' } ) ).toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Show chart' } ) );

		expect( screen.getByTestId( 'chart' ) ).toBeInTheDocument();
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
} );
