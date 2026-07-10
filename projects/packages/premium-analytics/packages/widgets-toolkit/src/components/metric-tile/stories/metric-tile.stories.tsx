import { comment, paragraph, postList, starEmpty } from '@wordpress/icons';
import { MetricTile, MetricTileGrid } from '../metric-tile';
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

// The grid is a size query container, so it takes its height from its parent —
// widget hosts provide a fixed cell. Stories must do the same or the grid
// collapses to zero height.
const makeCanvas = ( width: string, height: string ): Decorator =>
	function CanvasDecorator( Story ) {
		return (
			<div style={ { width, height, display: 'flex', flexDirection: 'column' } }>
				<Story />
			</div>
		);
	};

const meta = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/MetricTile',
	component: MetricTileGrid,
	tags: [ 'autodocs' ],
	argTypes: {
		columns: { control: { type: 'number', min: 1, max: 6 } },
	},
	parameters: {
		docs: {
			description: {
				component:
					'Responsive grid of metric tiles, driven by container queries on both axes: in a ' +
					'narrow or short container each tile renders as a compact row (icon and label on ' +
					'the left, value on the right); at 640px+ wide and 240px+ tall the tiles lay out ' +
					'`columns` across with the icon, label, and a larger value centered. The grid takes ' +
					'its height from its parent, so it must live in a height-constrained ancestor.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof MetricTileGrid > >;

export default meta;

type Story = StoryObj< { columns: number } >;

function renderTiles( { columns }: { columns: number } ) {
	return (
		<MetricTileGrid columns={ columns }>
			{ TILES.map( tile => (
				<MetricTile
					key={ tile.key }
					icon={ tile.icon }
					label={ tile.label }
					value={ tile.value }
					dataFormat={ COUNT_FORMAT }
				/>
			) ) }
		</MetricTileGrid>
	);
}

/**
 * Four tiles in the default two-column wide layout, in a canvas tall and wide
 * enough for tile mode.
 */
export const Default: Story = {
	render: renderTiles,
	args: { columns: 2 },
	decorators: [ makeCanvas( '100%', '480px' ) ],
};

/**
 * A narrow container renders the compact row layout regardless of the
 * viewport, because the query tracks the container's width.
 */
export const NarrowContainer: Story = {
	render: renderTiles,
	args: { columns: 2 },
	decorators: [ makeCanvas( '360px', '480px' ) ],
};

/**
 * A wide but short container also renders the compact rows — stacked tile
 * rows would not fit, and rows read better than a clipped tile grid.
 */
export const ShortContainer: Story = {
	render: renderTiles,
	args: { columns: 2 },
	decorators: [ makeCanvas( '100%', '180px' ) ],
};

/**
 * A `null` value renders the placeholder ("—" by default) instead of a
 * formatted zero — for metrics a site doesn't have yet, like a rate that
 * cannot be computed.
 */
export const WithPlaceholderValue: Story = {
	render: ( { columns } ) => (
		<MetricTileGrid columns={ columns }>
			<MetricTile
				icon={ postList }
				label="Open rate"
				value={ null }
				dataFormat={ { type: 'percentage', options: { decimals: 1 } } }
			/>
			<MetricTile
				icon={ starEmpty }
				label="Click rate"
				value={ 0.381 }
				dataFormat={ { type: 'percentage', options: { decimals: 1 } } }
			/>
		</MetricTileGrid>
	),
	args: { columns: 2 },
	decorators: [ makeCanvas( '100%', '320px' ) ],
};
