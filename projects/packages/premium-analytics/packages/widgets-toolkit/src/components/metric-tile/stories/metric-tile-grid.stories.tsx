import { comment, paragraph, postList, starEmpty } from '@wordpress/icons';
import { MetricTileGrid } from '../metric-tile-grid';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';

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

const makeCanvas = ( width: string, height: string ): Decorator =>
	function CanvasDecorator( Story ) {
		return (
			<div style={ { width, height, display: 'flex', flexDirection: 'column' } }>
				<Story />
			</div>
		);
	};

const meta = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/MetricTileGrid',
	component: MetricTileGrid,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Responsive grid of metric tiles that follows the widget cell size and picks its ' +
					'own layout — no column count needed. A narrow cell renders compact rows (icon ' +
					'and label on the left, value on the right); a wide but short cell spreads the ' +
					'tiles across a single row; a wide and tall cell uses a balanced two-column grid ' +
					'of large centered tiles.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof MetricTileGrid > >;

export default meta;

type Story = StoryObj< ComponentProps< typeof MetricTileGrid > >;

/**
 * Wide and tall: a balanced two-column grid of large centered tiles.
 */
export const Default: Story = {
	args: { tiles: TILES, dataFormat: COUNT_FORMAT },
	decorators: [ makeCanvas( '100%', '480px' ) ],
};

/**
 * A narrow container renders the compact row layout regardless of the
 * viewport, because the grid follows its own rendered size.
 */
export const NarrowContainer: Story = {
	args: { tiles: TILES, dataFormat: COUNT_FORMAT },
	decorators: [ makeCanvas( '360px', '480px' ) ],
};

/**
 * A wide but short container spreads the tiles across a single row — the column
 * count follows the number of tiles, so four tiles render one-by-four.
 */
export const WideShort: Story = {
	args: { tiles: TILES, dataFormat: COUNT_FORMAT },
	decorators: [ makeCanvas( '100%', '220px' ) ],
};

/**
 * The same tiles in a very wide, short cell — still one row, just more room per
 * tile. This mirrors the wide dashboard-cell case.
 */
export const WideShortRoomy: Story = {
	args: { tiles: TILES, dataFormat: COUNT_FORMAT },
	decorators: [ makeCanvas( '1026px', '280px' ) ],
};

/**
 * Three tiles: the layout still balances without an awkward orphan row — one row
 * when short, and a filled two-column grid when tall.
 */
export const ThreeTiles: Story = {
	args: { tiles: TILES.slice( 0, 3 ), dataFormat: COUNT_FORMAT },
	decorators: [ makeCanvas( '100%', '480px' ) ],
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
	decorators: [ makeCanvas( '100%', '320px' ) ],
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
	decorators: [ makeCanvas( '100%', '320px' ) ],
};
