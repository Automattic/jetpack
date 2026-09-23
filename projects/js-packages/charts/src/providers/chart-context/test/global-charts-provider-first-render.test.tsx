import { render } from '@testing-library/react';
import { GlobalChartsProvider } from '../global-charts-provider';
import { useGlobalChartsContext } from '../hooks/use-global-charts-context';
import { createPaletteGenerator } from '../private/palette-generator';

describe( 'GlobalChartsProvider before the palette resolves', () => {
	it( 'renders the palette slot 1 resolves to where no DOM answers', () => {
		const renders: string[][] = [];

		const FirstColors = () => {
			const { getElementStyles } = useGlobalChartsContext();
			renders.push( [ 0, 1 ].map( index => getElementStyles( { index } ).color ) );
			return null;
		};

		render(
			<GlobalChartsProvider>
				<FirstColors />
			</GlobalChartsProvider>
		);

		expect( renders[ 0 ] ).toEqual( [
			'#3858e9',
			createPaletteGenerator( [ '#3858e9' ], '#ffffff' )( 1 ),
		] );
	} );
} );
