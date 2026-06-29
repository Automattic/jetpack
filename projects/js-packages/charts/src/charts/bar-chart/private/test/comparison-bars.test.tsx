import { render, screen } from '@testing-library/react';
import { scaleBand, scaleLinear } from '@visx/scale';
import { DataContext } from '@visx/xychart';
import { ComparisonBars } from '../comparison-bars';
import type { DataPointDate, SeriesData } from '../../../../types';
import type { ComparisonSeriesEntry } from '../comparison-bars';

// Build the band scale over two categories (matches how BarGroup sets it up)
const categories = [ 'Jan', 'Feb' ];
const xScale = scaleBand( {
	domain: categories,
	range: [ 0, 200 ],
	padding: 0.1,
} );

// Simple linear value scale: domain 0..100 -> range 200..0 (SVG coords, descending)
const yScale = scaleLinear( { domain: [ 0, 100 ], range: [ 200, 0 ] } );

// The primaryKeys in this test
const primaryKeys = [ 'current' ];
const groupPadding = 0.1;

// Build the same groupScale so tests can compute expected width
const groupScale = scaleBand( {
	domain: primaryKeys,
	range: [ 0, xScale.bandwidth() ],
	padding: groupPadding,
} );

// Minimal DataContext value
const dataContextValue = {
	xScale: xScale as never,
	yScale: yScale as never,
	horizontal: false,
	// Other DataContext fields the component doesn't use
	width: 200,
	height: 200,
	margin: { top: 0, right: 0, bottom: 0, left: 0 },
	dataRegistry: {} as never,
	registerData: () => undefined,
	unregisterData: () => undefined,
	setDimensions: () => undefined,
	innerWidth: 200,
	innerHeight: 200,
	theme: {} as never,
	colorScale: {} as never,
};

const seriesData: SeriesData = {
	label: 'Comparison',
	data: [
		{ label: 'Jan', value: 40 } as DataPointDate,
		{ label: 'Feb', value: 70 } as DataPointDate,
	] as DataPointDate[],
	options: { type: 'comparison' },
};

const comparisonEntries: ComparisonSeriesEntry[] = [
	{ series: seriesData, index: 0, primaryKey: 'current', primaryIndex: 0 },
];

const getElementStyles = () => ( {
	color: '#f00',
	barStyles: { widthFactor: 1.5, opacity: 0.5 },
	lineStyles: {} as never,
	glyph: undefined as never,
	shapeStyles: {} as never,
} );

const resolveFill = () => '#f00';

const xAccessor = ( d: DataPointDate ) => d.label;
const yAccessor = ( d: DataPointDate ) => d.value ?? undefined;

describe( 'ComparisonBars', () => {
	it( 'renders two shadow rects for two data points', () => {
		render(
			<svg>
				<DataContext.Provider value={ dataContextValue }>
					<ComparisonBars
						comparisonEntries={ comparisonEntries }
						primaryKeys={ primaryKeys }
						groupPadding={ groupPadding }
						horizontal={ false }
						xAccessor={ xAccessor }
						yAccessor={ yAccessor }
						getElementStyles={ getElementStyles }
						resolveFill={ resolveFill }
					/>
				</DataContext.Provider>
			</svg>
		);

		const rects = screen.getAllByTestId( /^bar-chart-comparison-0-/ );
		expect( rects ).toHaveLength( 2 );
		expect( rects[ 0 ] ).toHaveAttribute( 'fill', '#f00' );
		expect( rects[ 0 ] ).toHaveAttribute( 'opacity', '0.5' );
		// width == widthFactor (1.5) * groupScale.bandwidth()
		expect( Number( rects[ 0 ].getAttribute( 'width' ) ) ).toBeCloseTo(
			1.5 * groupScale.bandwidth()
		);
	} );

	it( 'wraps rects in a g with correct class and pointerEvents', () => {
		render(
			<svg>
				<DataContext.Provider value={ dataContextValue }>
					<ComparisonBars
						comparisonEntries={ comparisonEntries }
						primaryKeys={ primaryKeys }
						groupPadding={ groupPadding }
						horizontal={ false }
						xAccessor={ xAccessor }
						yAccessor={ yAccessor }
						getElementStyles={ getElementStyles }
						resolveFill={ resolveFill }
					/>
				</DataContext.Provider>
			</svg>
		);

		const g = screen.getByTestId( 'bar-chart-comparison-bars' );
		expect( g ).toHaveClass( 'bar-chart__comparison-bars', { exact: true } );
		expect( g ).toHaveAttribute( 'pointer-events', 'none' );
	} );

	it( 'shadow rect is horizontally centered on the primary bar slot at widthFactor × slot width', () => {
		render(
			<svg>
				<DataContext.Provider value={ dataContextValue }>
					<ComparisonBars
						comparisonEntries={ comparisonEntries }
						primaryKeys={ primaryKeys }
						groupPadding={ groupPadding }
						horizontal={ false }
						xAccessor={ xAccessor }
						yAccessor={ yAccessor }
						getElementStyles={ getElementStyles }
						resolveFill={ resolveFill }
					/>
				</DataContext.Provider>
			</svg>
		);

		const rects = screen.getAllByTestId( /^bar-chart-comparison-0-/ );
		const rect = rects[ 0 ]; // 'Jan' datum

		const slotThickness = groupScale.bandwidth();
		const expectedWidth = 1.5 * slotThickness; // shadow = widthFactor × slot width
		// Shadow x = bandStart + slotOffset + slotThickness/2 - shadowWidth/2
		const bandStart = Number( xScale( 'Jan' ) );
		const slotOffset = Number( groupScale( 'current' ) );
		const expectedX = bandStart + slotOffset + slotThickness / 2 - expectedWidth / 2;
		const expectedCenterX = expectedX + expectedWidth / 2;
		const primarySlotCenterX = bandStart + slotOffset + slotThickness / 2;

		expect( Number( rect.getAttribute( 'width' ) ) ).toBeCloseTo( expectedWidth );
		expect( Number( rect.getAttribute( 'x' ) ) ).toBeCloseTo( expectedX );
		// Center of shadow matches center of primary slot
		expect( expectedCenterX ).toBeCloseTo( primarySlotCenterX );
	} );

	it( 'renders nothing when primaryKeys is empty', () => {
		render(
			<svg>
				<DataContext.Provider value={ dataContextValue }>
					<ComparisonBars
						comparisonEntries={ comparisonEntries }
						primaryKeys={ [] }
						groupPadding={ groupPadding }
						horizontal={ false }
						xAccessor={ xAccessor }
						yAccessor={ yAccessor }
						getElementStyles={ getElementStyles }
						resolveFill={ resolveFill }
					/>
				</DataContext.Provider>
			</svg>
		);

		expect( screen.queryByTestId( 'bar-chart-comparison-bars' ) ).not.toBeInTheDocument();
	} );
} );
