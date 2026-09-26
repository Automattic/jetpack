import { render } from '@testing-library/react';
import { GlobalChartsProvider } from '../global-charts-provider';
import { useGlobalChartsContext } from '../hooks/use-global-charts-context';

describe( 'GlobalChartsProvider before the palette resolves', () => {
	it( 'renders the same colors an unthemed page resolves to', () => {
		const renders: string[][] = [];

		const FirstColors = () => {
			const { getElementStyles } = useGlobalChartsContext();
			renders.push(
				Array.from( { length: 6 }, ( _, index ) => getElementStyles( { index } ).color )
			);
			return null;
		};

		render(
			<GlobalChartsProvider>
				<FirstColors />
			</GlobalChartsProvider>
		);

		expect( renders.length ).toBeGreaterThan( 1 );
		expect( renders[ 0 ][ 0 ] ).toBe( '#3858e9' );
		expect( renders[ 0 ] ).toEqual( renders[ renders.length - 1 ] );
	} );
} );
