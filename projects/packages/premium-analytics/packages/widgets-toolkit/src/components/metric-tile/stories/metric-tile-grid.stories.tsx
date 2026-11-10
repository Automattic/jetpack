import { comment, paragraph, postList, starEmpty } from '@wordpress/icons';
import { useElementSize } from '../../../hooks';
import { MetricTileGrid } from '../metric-tile-grid';
import { MetricTileGridSkeleton } from '../metric-tile-grid-skeleton';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { ComponentProps, CSSProperties, ReactNode } from 'react';

const COUNT_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

const TILES = [
	{ key: 'posts', icon: postList, label: 'Posts', value: 12 },
	{ key: 'words', icon: paragraph, label: 'Words', value: 34567 },
	{ key: 'likes', icon: starEmpty, label: 'Likes', value: 891 },
	{ key: 'comments', icon: comment, label: 'Comments', value: 42 },
];

// Enough tiles for the resizable story to reach every count the layouts cover.
const MORE_TILES = [
	...TILES,
	{ key: 'views', icon: postList, label: 'Views', value: 18400 },
	{ key: 'visitors', icon: starEmpty, label: 'Visitors', value: 12100 },
	{ key: 'subscribers', icon: comment, label: 'Subscribers', value: 1024 },
	{ key: 'shares', icon: paragraph, label: 'Shares', value: 77 },
];

const CANVAS_STYLE: CSSProperties = {
	border: '1px solid var(--wpds-color-stroke-surface-neutral-weak)',
	borderRadius: 'var(--wpds-border-radius-md)',
	background: 'var(--wpds-color-background-surface-neutral)',
	padding: 'var(--wpds-dimension-padding-lg)',
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	overflow: 'hidden',
};

/* Frames a story as a widget body of a given size, inset by the dashboard's
 * `--wp-ui-card-padding` override. The grid lays itself out from that size. */
const makeCanvas = ( width: string, height: string ): Decorator =>
	function CanvasDecorator( Story ) {
		return (
			<div style={ { ...CANVAS_STYLE, width, height } }>
				<Story />
			</div>
		);
	};

/* A widget body the reader resizes by its corner. The size printed above it is
 * the box the grid fills, which is the one its layout follows. */
function ResizableCanvas( { children }: { children: ReactNode } ) {
	const [ boxRef, size ] = useElementSize< HTMLDivElement >();

	return (
		<>
			<p style={ { margin: '0 0 8px', font: '12px/1.5 monospace' } }>
				{ `${ size.width } × ${ size.height } px` }
			</p>
			<div
				style={ {
					...CANVAS_STYLE,
					width: 720,
					height: 380,
					minWidth: 200,
					minHeight: 100,
					maxWidth: '100%',
					resize: 'both',
				} }
			>
				<div
					ref={ boxRef }
					style={ { display: 'flex', flex: '1 1 0', flexDirection: 'column', minHeight: 0 } }
				>
					{ children }
				</div>
			</div>
		</>
	);
}

const meta = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/MetricTileGrid',
	component: MetricTileGrid,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Metric tiles laid out from the size of their own box, wherever the widget is ' +
					'placed. A narrow box gets a vertical list (icon and label on the left, value on ' +
					'the right): stretched to fill when each row has room, compact and scrolling ' +
					'when it does not. A wider box gets a single row of centered tiles, or a ' +
					'two-column grid once it is tall enough for every tile row, the last tile ' +
					'taking the whole row when the count is odd.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof MetricTileGrid > >;

export default meta;

type Story = StoryObj< ComponentProps< typeof MetricTileGrid > >;

/**
 * Wide and tall: a two-column grid of centered tiles.
 */
export const Default: Story = {
	args: { tiles: TILES, dataFormat: COUNT_FORMAT },
	decorators: [ makeCanvas( '720px', '380px' ) ],
};

/**
 * Narrow and tall: the rows stretch to share the body.
 */
export const Stacked: Story = {
	args: { tiles: TILES, dataFormat: COUNT_FORMAT },
	decorators: [ makeCanvas( '360px', '380px' ) ],
};

/**
 * Narrow and short: each row keeps its own height and the list scrolls.
 */
export const Compact: Story = {
	args: { tiles: TILES, dataFormat: COUNT_FORMAT },
	decorators: [ makeCanvas( '360px', '170px' ) ],
};

/**
 * Wide and short: one row of centered tiles.
 */
export const Row: Story = {
	args: { tiles: TILES, dataFormat: COUNT_FORMAT },
	decorators: [ makeCanvas( '720px', '170px' ) ],
};

/**
 * Three tiles in a tall cell: the trailing tile takes the last row rather than
 * leaving half of it empty.
 */
export const ThreeTiles: Story = {
	args: { tiles: TILES.slice( 0, 3 ), dataFormat: COUNT_FORMAT },
	decorators: [ makeCanvas( '720px', '380px' ) ],
};

type ResizableStoryArgs = {
	tileCount: number;
};

/**
 * Drag the corner of the box to resize it. The tiles are a list while the box
 * is narrow and sit side by side once it is wide enough, and each of the two
 * splits again by height: compact or stacked, row or grid. The height it takes
 * depends on how many tiles there are.
 */
export const Resizable: StoryObj< ResizableStoryArgs > = {
	render: ( { tileCount } ) => (
		<ResizableCanvas>
			<MetricTileGrid tiles={ MORE_TILES.slice( 0, tileCount ) } dataFormat={ COUNT_FORMAT } />
		</ResizableCanvas>
	),
	args: { tileCount: 4 },
	argTypes: {
		tileCount: { control: { type: 'range', min: 1, max: MORE_TILES.length, step: 1 } },
	},
};

/**
 * Setting a tile's `previousValue` opts it into the comparison layout, where the
 * value renders with a period-over-period delta. A number shows the delta; an
 * explicit `null` (comparison requested but no comparable data) renders the
 * value alone, so tiles stay consistently sized whether or not a comparison is
 * available. `note` adds a hover caveat mirrored as visually hidden text.
 */
export const WithComparison: Story = {
	args: {
		dataFormat: COUNT_FORMAT,
		tiles: [
			{ key: 'views', icon: postList, label: 'Views', value: 18400, previousValue: 16100 },
			{
				key: 'visitors',
				icon: starEmpty,
				label: 'Visitors',
				value: 12100,
				previousValue: 10800,
				note: 'Sum of daily visitors — a returning visitor is counted once per day.',
			},
			{ key: 'likes', icon: starEmpty, label: 'Likes', value: 842, previousValue: 905 },
			// Comparison requested but no comparable data: the value renders alone.
			{ key: 'comments', icon: comment, label: 'Comments', value: 296, previousValue: null },
		],
	},
	decorators: [ makeCanvas( '720px', '320px' ) ],
};

/**
 * A `null` value renders the placeholder ("—" by default) instead of a
 * formatted zero — for metrics a site doesn't have yet, like a rate that
 * cannot be computed.
 */
export const WithPlaceholderValue: Story = {
	args: {
		tiles: [
			{
				key: 'openRate',
				icon: postList,
				label: 'Open rate',
				value: null,
				dataFormat: { type: 'percentage', options: { decimals: 1 } },
			},
			{
				key: 'clickRate',
				icon: starEmpty,
				label: 'Click rate',
				value: 0.381,
				dataFormat: { type: 'percentage', options: { decimals: 1 } },
			},
		],
	},
	decorators: [ makeCanvas( '720px', '320px' ) ],
};

type SkeletonStory = StoryObj< ComponentProps< typeof MetricTileGridSkeleton > >;

/**
 * The loading shape widgets pass through `WidgetState`'s `renderLoading`: one
 * label and value placeholder per metric, in the grid arrangement here.
 */
export const Skeleton: SkeletonStory = {
	render: args => <MetricTileGridSkeleton { ...args } />,
	args: { tiles: 4 },
	decorators: [ makeCanvas( '720px', '380px' ) ],
};

/**
 * Narrow and tall: the stand-ins stretch like the loaded rows do.
 */
export const SkeletonStacked: SkeletonStory = {
	render: args => <MetricTileGridSkeleton { ...args } />,
	args: { tiles: 4 },
	decorators: [ makeCanvas( '360px', '380px' ) ],
};

/**
 * Narrow and short: the stand-ins keep their own height, as the compact list
 * does.
 */
export const SkeletonCompact: SkeletonStory = {
	render: args => <MetricTileGridSkeleton { ...args } />,
	args: { tiles: 4 },
	decorators: [ makeCanvas( '360px', '170px' ) ],
};

/**
 * Wide and short: the stand-ins sit on one row.
 */
export const SkeletonRow: SkeletonStory = {
	render: args => <MetricTileGridSkeleton { ...args } />,
	args: { tiles: 4 },
	decorators: [ makeCanvas( '720px', '170px' ) ],
};
