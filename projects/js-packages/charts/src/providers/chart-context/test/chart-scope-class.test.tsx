import { render } from '@testing-library/react';
import { CHART_SCOPE_CLASS } from '../../../styles/chart-scope-class';
import { GlobalChartsProvider } from '../global-charts-provider';

describe( 'GlobalChartsProvider wrapper class', () => {
	it( 'carries the a8c-charts-scope class', () => {
		const { container } = render(
			<GlobalChartsProvider>
				<div>child</div>
			</GlobalChartsProvider>
		);

		// eslint-disable-next-line testing-library/no-node-access
		const wrapper = container.firstElementChild;

		expect( wrapper ).toHaveClass( CHART_SCOPE_CLASS );
	} );
} );
