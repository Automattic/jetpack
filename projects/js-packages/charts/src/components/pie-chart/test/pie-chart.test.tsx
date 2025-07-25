/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../../../providers/theme';
import PieChart from '../pie-chart';

describe( 'PieChart', () => {
	const defaultProps = {
		size: 500,
		data: [
			{ label: 'A', percentage: 50, value: 50 },
			{ label: 'B', percentage: 50, value: 50 },
		],
	};

	const renderWithTheme = ( props = {} ) => {
		return render(
			<ThemeProvider>
				<PieChart { ...defaultProps } { ...props } />
			</ThemeProvider>
		);
	};

	describe( 'Data Validation', () => {
		test( 'validates total percentage equals 100', () => {
			renderWithTheme( {
				data: [
					{ label: 'A', percentage: 60, value: 60 },
					{ label: 'B', percentage: 50, value: 50 },
				],
			} );
			expect( screen.getByText( /invalid percentage total/i ) ).toBeInTheDocument();
		} );

		test( 'handles negative values', () => {
			renderWithTheme( {
				data: [
					{ label: 'A', percentage: -30, value: -30 },
					{ label: 'B', percentage: 130, value: 130 },
				],
			} );
			expect( screen.getByText( /invalid data/i ) ).toBeInTheDocument();
		} );

		test( 'handles empty data array', () => {
			renderWithTheme( { data: [] } );
			expect( screen.getByText( /no data available/i ) ).toBeInTheDocument();
		} );

		test( 'handles single data point', () => {
			renderWithTheme( {
				data: [ { label: 'A', percentage: 100, value: 100 } ],
			} );
			expect( screen.getByText( 'A' ) ).toBeInTheDocument();
		} );
	} );
} );
