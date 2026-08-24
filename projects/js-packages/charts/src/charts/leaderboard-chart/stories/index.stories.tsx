import { Stack } from '@wordpress/ui';
import { action } from 'storybook/actions';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { defaultTheme, useGlobalChartsContext } from '../../../providers';
import {
	chartDecorator,
	sharedChartArgTypes,
	sharedThemeArgs,
	ChartStoryArgs,
	trafficSourcesData as sampleData,
	shortTrafficSourcesData as smallDataset,
	revenueMetricsData as largeValues,
	decliningMetricsData as negativeGrowth,
	categorizedMetricsData as dataWithImageColor,
	themeArgTypes,
} from '../../../stories';
import {
	legendArgTypes,
	extractLegendConfig,
	type LegendStoryControls,
} from '../../../stories/legend-config';
import { formatMetricValue, hexToRgba } from '../../../utils';
import { SUBPIXEL_TOLERANCE } from '../hooks';
import LeaderboardChart, { LeaderboardChartUnresponsive } from '../leaderboard-chart';
import type { ChartLegendConfig, LeaderboardEntry } from '../../../types';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof LeaderboardChart > > &
	LegendStoryControls;

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts Library/Charts/Leaderboard Chart',
	component: LeaderboardChart,
	parameters: {
		layout: 'centered',
	},
	tags: [ 'autodocs' ],
	argTypes: {
		data: {
			control: 'object',
			description: 'Array of leaderboard entries to display',
			table: {
				type: { summary: 'LeaderboardEntry[]' },
			},
		},
		withComparison: {
			control: 'boolean',
			description: 'Whether to show comparison data (previous period bars and delta values)',
			table: {
				defaultValue: { summary: 'false' },
			},
		},
		primaryColor: {
			control: 'color',
			description: 'Primary color for current period bars',
			table: {
				defaultValue: { summary: defaultTheme.leaderboardChart.primaryColor },
			},
		},
		secondaryColor: {
			control: 'color',
			description: 'Secondary color for comparison period bars',
			table: {
				defaultValue: { summary: defaultTheme.leaderboardChart.secondaryColor },
			},
		},
		valueFormatter: {
			control: false,
			description: 'Custom formatter function for values',
			table: {
				type: { summary: '(value: number) => string' },
				defaultValue: { summary: 'formatMetricValue with compact notation' },
			},
		},
		deltaFormatter: {
			control: false,
			description: 'Custom formatter function for delta values',
			table: {
				type: { summary: '(value: number) => string' },
				defaultValue: { summary: 'formatMetricValue as percentage' },
			},
		},
		loading: {
			control: 'boolean',
			description: 'Whether the chart is in loading state',
			table: {
				defaultValue: { summary: 'false' },
			},
		},
		className: {
			control: 'text',
			description: 'Additional CSS class name for the chart container',
			table: {
				type: { summary: 'string' },
			},
		},
		style: {
			control: 'object',
			description: 'Custom styling for the chart container',
			table: {
				type: { summary: 'React.CSSProperties' },
			},
		},
		withOverlayLabel: {
			control: 'boolean',
			description: 'Whether to overlay the label on top of the bar',
			table: {
				defaultValue: { summary: 'false' },
			},
		},
		legendLabels: {
			control: 'object',
			description: 'Custom labels for legend items',
			table: {
				category: 'Legend',
				type: { summary: '{ primary?: string; comparison?: string }' },
				defaultValue: { summary: 'undefined' },
			},
		},
		...sharedChartArgTypes,
		...legendArgTypes,
		...themeArgTypes,
	},
	args: {
		primaryColor: undefined,
		secondaryColor: undefined,
		themeName: 'default',
		showLegend: false,
		legendPosition: 'bottom',
		legendAlignment: 'center',
		legendOrientation: 'horizontal',
		legendShape: 'circle',
		withOverlayLabel: false,
	},
	decorators: [ chartDecorator ],
	render: args => {
		const legend = extractLegendConfig< ChartLegendConfig< LeaderboardEntry > >( args );
		return <LeaderboardChart { ...args } legend={ legend } />;
	},
};

export default meta;
type Story = StoryObj< StoryArgs >;

export const Default: Story = {
	args: {
		...sharedThemeArgs,
		data: sampleData,
		withComparison: true,
		loading: false,
	},
};

export const FixedDimensions: Story = {
	args: {
		...Default.args,
		width: 300,
		height: 400,
	},
};

export const AspectRatio: Story = {
	args: {
		...Default.args,
		aspectRatio: 0.4,
	},
};

export const WithoutComparison: Story = {
	args: {
		data: sampleData,
		withComparison: false,
		loading: false,
	},
};

export const WithOverlayLabel: Story = {
	args: {
		data: sampleData,
		withOverlayLabel: true,
	},
};

const zeroChangeData: LeaderboardEntry[] = sampleData.map( ( entry, index ) =>
	index === 0
		? {
				...entry,
				currentValue: 0,
				previousValue: 0,
				currentShare: 0,
				previousShare: 0,
				delta: 0,
		  }
		: entry
);

export const ZeroChange: Story = {
	args: {
		data: zeroChangeData,
		withComparison: true,
		loading: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					'The first row is `0` in both periods, so its genuine zero change renders as a neutral `0%` rather than an unavailable-delta placeholder.',
			},
		},
	},
	play: async ( { canvasElement } ) => {
		const canvas = within( canvasElement );

		await expect( canvas.getByText( '0%' ) ).toBeInTheDocument();
		await expect( canvas.queryByText( 'Percentage change unavailable' ) ).not.toBeInTheDocument();
	},
};

const unavailableDeltaData: LeaderboardEntry[] = sampleData.map( ( entry, index ) =>
	index === 0
		? {
				...entry,
				previousValue: 0,
				previousShare: 0,
				delta: undefined,
		  }
		: entry
);

export const UnavailableDelta: Story = {
	args: {
		data: unavailableDeltaData,
		withComparison: true,
		loading: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					'The first row has a known previous value of `0`, so its comparison data remains available while its mathematically undefined percentage change renders as an em dash instead of `+100%`.',
			},
		},
	},
	play: async ( { canvasElement } ) => {
		const canvas = within( canvasElement );

		// getAllByText rather than getByText so adding another placeholder row to
		// the fixture fails on the count instead of on an ambiguous match.
		await expect( canvas.getAllByText( '—' ) ).toHaveLength( 1 );
		await expect( canvas.getByText( 'Percentage change unavailable' ) ).toBeInTheDocument();
		// The discriminator: a known previous value of 0 must not fall into the
		// missing-comparison bucket.
		await expect( canvas.queryByText( 'No comparison data' ) ).not.toBeInTheDocument();
		await expect( canvas.queryByText( '+100%' ) ).not.toBeInTheDocument();
	},
};

const missingComparisonData: LeaderboardEntry[] = sampleData.map( entry =>
	entry.id === 'social' || entry.id === 'referral'
		? {
				id: entry.id,
				label: entry.label,
				currentValue: entry.currentValue,
				currentShare: entry.currentShare,
		  }
		: entry
);

export const MissingComparisonRows: Story = {
	args: {
		data: missingComparisonData,
		withComparison: true,
		loading: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Rows without a matching comparison-period value ("Social Media" and "Referral" here) omit `previousValue`/`previousShare`/`delta`. Those rows render no comparison bar and show a placeholder in the delta column instead of a fabricated value.',
			},
		},
	},
	play: async ( { canvasElement } ) => {
		const canvas = within( canvasElement );

		await expect( canvas.getAllByText( '—' ) ).toHaveLength( 2 );
		await expect( canvas.getAllByText( 'No comparison data' ) ).toHaveLength( 2 );
	},
};

export const MissingComparisonRowsWithOverlayLabel: Story = {
	args: {
		data: missingComparisonData,
		withComparison: true,
		withOverlayLabel: true,
		loading: false,
		style: {
			'--a8c-charts-border-radius-leaderboard-bar': '4px',
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					'Missing comparison rows in the overlay-label variant, as used by the Premium Analytics Stats widgets. The delta column still shows a placeholder for rows without comparison data.',
			},
		},
	},
};

export const Loading: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: true,
	},
};

const onLeaderboardItemClick = action( 'leaderboard-item-click' );

export const Interactive: Story = {
	args: {
		data: sampleData.map( entry => ( {
			...entry,
			label: (
				<span
					style={ {
						display: 'flex',
						alignItems: 'center',
						minHeight: '40px',
						padding: '0 6px',
						fontSize: '13px',
					} }
				>
					{ entry.label }
				</span>
			),
			onClick: () => onLeaderboardItemClick( entry.id ),
		} ) ),
		withComparison: true,
		withOverlayLabel: true,
		style: {
			'--a8c-charts-border-radius-leaderboard-bar': '4px',
		},
	},
	render: args => <LeaderboardChartWithOverlayLabelImage { ...args } />,
	parameters: {
		docs: {
			description: {
				story:
					'Rows with an `onClick` become interactive: the whole row is clickable and keyboard-focusable (Enter/Space), with a chevron revealed on hover/focus. The consumer supplies the action (e.g. drill-down).',
			},
		},
	},
};

export const MixedInteractivity: Story = {
	args: {
		...sharedThemeArgs,
		data: sampleData.map( ( entry, index ) =>
			index % 2 === 0 ? { ...entry, onClick: () => onLeaderboardItemClick( entry.id ) } : entry
		),
		withComparison: true,
		withOverlayLabel: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Interactive and non-interactive rows with the overlay-label presentation used by Jetpack Stats. Being clickable is a visual affordance only — it must not change a row height or column alignment, otherwise a drill-down that swaps clickable parent rows for non-clickable child rows visibly shifts the list.',
			},
		},
	},
	play: async ( { canvasElement } ) => {
		const grid = canvasElement.querySelector( '[class*="leaderboardChart__content"] > *' );

		// Every entry uses the same row wrapper; only the interactive rows are buttons.
		const rows = grid.querySelectorAll( ':scope > [class*="row"]' );
		expect( rows ).toHaveLength( sampleData.length );

		// The story must actually mix both row types for the rest to mean anything.
		const interactiveRows = grid.querySelectorAll( ':scope > button[class*="row"]' ).length;
		expect( interactiveRows ).toBeGreaterThan( 0 );
		expect( interactiveRows ).toBeLessThan( sampleData.length );

		// Both wrapper types must have the same height.
		const heights = new Set( [ ...rows ].map( row => row.getBoundingClientRect().height ) );
		expect( heights.size ).toBe( 1 );

		// Column edges are read off the cells themselves — the button wrapper spans
		// the full row even when its padding insets the cells inside it.
		const edge = ( selector: string, side: 'left' | 'right' ) =>
			new Set(
				[ ...grid.querySelectorAll( selector ) ].map( cell => cell.getBoundingClientRect()[ side ] )
			);
		expect( edge( '[class*="barWithLabelContainer"]', 'left' ).size ).toBe( 1 );
		expect( edge( '[class*="valueContainer"]', 'right' ).size ).toBe( 1 );
	},
};

export const Animation: Story = {
	args: {
		...Default.args,
		animation: true,
	},
};

export const CustomColors: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,
		primaryColor: 'red',
		secondaryColor: 'green',
	},
};

export const SmallDataset: Story = {
	args: {
		data: smallDataset,
		withComparison: true,
		loading: false,
	},
};

export const EmptyData: Story = {
	args: {
		data: [],
		withComparison: true,
		loading: false,
	},
};

export const EmptyDataWithChildren: Story = {
	args: {
		data: [],
		withComparison: true,
		loading: false,
	},
	render: args => (
		<LeaderboardChart { ...args }>
			<Stack direction="row" gap="xs" align="center" justify="center">
				Child element
			</Stack>
		</LeaderboardChart>
	),
};

export const LargeValues: Story = {
	args: {
		data: largeValues,
		withComparison: true,
		loading: false,
	},
};

export const NegativeGrowth: Story = {
	args: {
		data: negativeGrowth,
		withComparison: true,
		loading: false,
	},
};

export const CurrencyFormatting: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,

		valueFormatter: ( value: number ) =>
			formatMetricValue( value, 'currency', {
				useMultipliers: true,
				decimals: 1,
			} ),
		deltaFormatter: ( value: number ) =>
			formatMetricValue( value / 100, 'average', {
				decimals: 0,
			} ),
	},
};

export const NumberFormatting: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,

		valueFormatter: ( value: number ) =>
			formatMetricValue( value, 'number', {
				useMultipliers: false,
				decimals: 0,
			} ),
		deltaFormatter: ( value: number ) =>
			formatMetricValue( value / 100, 'average', {
				decimals: 1,
			} ),
	},
};

const CustomLabelComponent = ( { label, imageColor, style = {} } ) => (
	<div
		style={ {
			display: 'flex',
			alignItems: 'center',
			gap: '8px',
			...style,
		} }
	>
		<img
			src={ `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><rect width='50' height='50' fill='${ encodeURIComponent(
				imageColor
			) }'/></svg>` }
			alt="icon"
			style={ {
				width: '28px',
				height: '28px',
				verticalAlign: 'middle',
				borderRadius: '4px',
			} }
		/>
		<span style={ { fontSize: '13px' } }>{ label }</span>
	</div>
);

export const CustomLabel: Story = {
	args: {
		data: dataWithImageColor.map( entry => ( {
			...entry,
			label: <CustomLabelComponent label={ entry.label } imageColor={ entry.imageColor } />,
		} ) ),
		withComparison: false,
		loading: false,
	},
};

export const AdvancedFormatting: Story = {
	args: {
		data: largeValues,
		withComparison: true,
		loading: false,

		valueFormatter: ( value: number ) => {
			if ( value >= 1000000 ) {
				return formatMetricValue( value, 'currency', {
					useMultipliers: true,
					decimals: 1,
				} );
			}
			return formatMetricValue( value, 'currency', {
				useMultipliers: false,
				decimals: 0,
			} );
		},
		deltaFormatter: ( value: number ) =>
			formatMetricValue( value / 100, 'average', {
				decimals: 1,
				signDisplay: 'always',
			} ),
	},
};

const LeaderboardChartWithOverlayLabelImage = ( args: StoryArgs ) => {
	const { getElementStyles } = useGlobalChartsContext();
	const { color: primaryColor } = getElementStyles( {
		index: 0,
		overrideColor: args.primaryColor,
	} );

	const primaryColorWithAlpha = hexToRgba( primaryColor, 0.08 );

	return <LeaderboardChart { ...args } primaryColor={ primaryColorWithAlpha } />;
};

export const OverlayLabelWithImage: Story = {
	args: {
		data: dataWithImageColor.map( entry => ( {
			...entry,
			label: (
				<CustomLabelComponent
					label={ entry.label }
					imageColor={ entry.imageColor }
					style={ { padding: '6px' } }
				/>
			),
		} ) ),
		withComparison: true,
		withOverlayLabel: true,
		loading: false,
		style: {
			'--a8c-charts-border-radius-leaderboard-bar': '4px',
		},
	},
	render: args => <LeaderboardChartWithOverlayLabelImage { ...args } />,
};

export const WithLegend: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,
		showLegend: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Props-based legend using `showLegend` and the `legend` config object. Use Storybook controls to adjust legend position, alignment, orientation, shape, and interactivity.',
			},
		},
	},
};

export const WithLegendLabels: Story = {
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,
		showLegend: true,
		legendLabels: {
			primary: 'Aug 11-Sep 9, 2025',
			comparison: 'Jul 11-Aug 11, 2025',
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					'Props-based legend using `showLegend`, the `legend` config object, and the `legendLabels` prop to customize primary and comparison labels. Other legend options (position, alignment, orientation, shape, interactivity) can be adjusted via Storybook controls.',
			},
		},
	},
};

export const WithCompositionLegend: Story = {
	render: args => {
		const legend = extractLegendConfig< ChartLegendConfig< LeaderboardEntry > >( args );
		return (
			<LeaderboardChart
				{ ...args }
				legend={ { interactive: legend?.interactive } }
				chartId="composition-leaderboard-chart"
			>
				<LeaderboardChart.Legend
					{ ...legend }
					shapeStyles={ { width: 8, height: 8, ...legend?.shapeStyles } }
				/>
			</LeaderboardChart>
		);
	},
	args: {
		data: sampleData,
		withComparison: true,
		loading: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Composition API using `<LeaderboardChart.Legend />` as a child component for explicit legend placement and configuration. This is the recommended approach for flexible legend positioning.',
			},
		},
	},
};
export const FitRows: Story = {
	render: args => <LeaderboardChartUnresponsive { ...args } fitRows />,
	args: {
		data: sampleData,
		loading: false,
		// The decorator's box stands in for a fixed-height dashboard tile. The
		// chart fills it, so dragging its resize handle changes the height the
		// rows are fitted to. No padding, so the tile height is the chart height.
		containerWidth: '360px',
		containerHeight: '180px',
		withPadding: false,
		resize: 'vertical',
	},
	parameters: {
		docs: {
			description: {
				story:
					"`fitRows` shows only the rows that fit the chart height instead of scrolling, for charts placed in a fixed-height container such as a dashboard tile. Rows that do not fit keep their place in the layout but are hidden from painting, hit testing, focus order, and the accessibility tree, so growing the container reveals them again immediately. Drag the container's resize handle to watch the visible row count follow the height — a row appears only once it fits whole.",
			},
		},
	},
	play: async ( { canvasElement } ) => {
		// Row heights depend on the web fonts, so measuring before they land
		// samples geometry the chart is still in the middle of correcting.
		await document.fonts.ready;

		const content = canvasElement.querySelector( '[class*="leaderboardChart__content"]' );
		const grid = content.querySelector( ':scope > [data-leaderboard-grid]' );
		const rows = [ ...grid.querySelectorAll( ':scope > [data-row-index]' ) ];
		const isHidden = row => getComputedStyle( row ).visibility === 'hidden';
		const visibleCount = () =>
			new Set(
				rows.filter( row => ! isHidden( row ) ).map( row => row.getAttribute( 'data-row-index' ) )
			).size;

		// The story only means something if the height actually forces a cut.
		await waitFor( () => {
			const hidden = rows.filter( isHidden );
			expect( hidden.length ).toBeGreaterThan( 0 );
			expect( hidden.length ).toBeLessThan( rows.length );
		} );

		// No inner scrollbar: the rows that do not fit are hidden, not scrolled to.
		expect( getComputedStyle( content ).overflow ).toBe( 'hidden' );

		// Every row left visible is whole — none is clipped by the container edge.
		const wholeRowsOnly = () => {
			const contentBottom = content.getBoundingClientRect().bottom;
			for ( const row of rows ) {
				if ( isHidden( row ) ) {
					continue;
				}
				expect( row.getBoundingClientRect().bottom ).toBeLessThanOrEqual(
					contentBottom + SUBPIXEL_TOLERANCE
				);
			}
		};
		wholeRowsOnly();

		// Assert the round trip: a pinned pixel height passes the first render and
		// silently breaks re-growth. The decorator's box is the resize target.
		const box = canvasElement.querySelector< HTMLElement >(
			'[data-testid="chart-story-container"]'
		);
		// Poll for the effect rather than sleeping a fixed amount: ResizeObserver
		// delivery is tied to the rendering pipeline, and a loaded CI runner can
		// miss a flat deadline.
		const resizeTo = async ( height, expected ) => {
			box.style.height = `${ height }px`;
			await waitFor( () => expected( visibleCount() ) );
			wholeRowsOnly();
			return visibleCount();
		};

		const atStart = visibleCount();

		const whenShort = await resizeTo( 100, count => expect( count ).toBeLessThan( atStart ) );
		await resizeTo( 280, count => expect( count ).toBeGreaterThan( whenShort ) );
		await resizeTo( 100, count => expect( count ).toBe( whenShort ) );
		await resizeTo( 180, count => expect( count ).toBe( atStart ) );
	},
};

export const FitRowsInteractive: Story = {
	render: args => <LeaderboardChartUnresponsive { ...args } fitRows />,
	args: {
		data: sampleData.map( entry => ( {
			...entry,
			onClick: () => onLeaderboardItemClick( entry.id ),
		} ) ),
		loading: false,
		containerWidth: '360px',
		containerHeight: '180px',
		withPadding: false,
		resize: 'vertical',
	},
	parameters: {
		docs: {
			description: {
				story:
					'`fitRows` with interactive rows: the rows that do not fit are hidden with `visibility: hidden`, which also removes them from the tab order and the accessibility tree. Tab through the chart to verify focus only ever lands on a fully visible row.',
			},
		},
	},
	play: async ( { canvasElement } ) => {
		await document.fonts.ready;

		const rows = [ ...canvasElement.querySelectorAll< HTMLElement >( '[data-row-index]' ) ];
		const isHidden = ( row: HTMLElement ) => getComputedStyle( row ).visibility === 'hidden';

		// The focus walk only means something if the height actually forces a cut.
		let visible: HTMLElement[] = [];
		await waitFor( () => {
			visible = rows.filter( row => ! isHidden( row ) );
			expect( visible.length ).toBeGreaterThan( 0 );
			expect( visible.length ).toBeLessThan( rows.length );
		} );

		// Tab lands on each fitted row in order…
		visible[ 0 ].focus();
		expect( visible[ 0 ] ).toHaveFocus();
		for ( const row of visible.slice( 1 ) ) {
			await userEvent.tab();
			expect( row ).toHaveFocus();
		}

		// …then leaves the chart: no hidden row ever takes focus.
		await userEvent.tab();
		const hidden = rows.filter( isHidden );
		expect( hidden ).not.toContain( canvasElement.ownerDocument.activeElement );
	},
};
