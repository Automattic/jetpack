import { render } from '@testing-library/react';
import { CHART_SCOPE_CLASS } from '../../../styles/chart-scope-class';
import { GlobalChartsProvider } from '../global-charts-provider';

describe( 'GlobalChartsProvider wrapper', () => {
	it( 'carries the a8c-charts-scope class and nothing that affects layout', () => {
		const { container } = render(
			<GlobalChartsProvider>
				<div>child</div>
			</GlobalChartsProvider>
		);

		// eslint-disable-next-line testing-library/no-node-access
		const wrapper = container.firstElementChild as HTMLElement;

		expect( wrapper ).toHaveClass( CHART_SCOPE_CLASS );
		// The catalog needs an element to sit on; `display: contents` is what keeps that element out of the consumer's layout.
		expect( wrapper.style.cssText.replace( /\s/g, '' ) ).toBe( 'display:contents;' );
	} );
} );
