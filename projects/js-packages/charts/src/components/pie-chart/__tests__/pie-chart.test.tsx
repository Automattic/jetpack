/**
 * @jest-environment jsdom
 */

import { render } from '@testing-library/react';
import { ThemeProvider } from '../../../providers/theme';
import PieChart from '../pie-chart';

describe( 'PieChart', () => {
	it( 'renders', () => {
		const { container } = render(
			<ThemeProvider>
				<PieChart data={ [ { label: 'A', percentage: 100, value: 100 } ] } />
			</ThemeProvider>
		);
		expect( container ).toBeTruthy();
	} );
} );
