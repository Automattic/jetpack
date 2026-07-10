import { comment, paragraph, postList, starEmpty } from '@wordpress/icons';
import { MetricTile, MetricTileGrid } from '../metric-tile';
import type { Meta, StoryObj } from '@storybook/react';
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
					'Responsive grid of metric tiles. The layout is container-query driven: below ' +
					'640px each tile renders as a compact row (icon and label on the left, value on ' +
					'the right); at 640px and up the tiles lay out `columns` across with the icon, ' +
					'label, and a larger value centered. Resize the canvas to see both layouts.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof MetricTileGrid > >;

export default meta;

type Story = StoryObj< { columns: number } >;

/**
 * Four tiles in the default two-column wide layout. Narrow the canvas below
 * 640px to see the compact row layout.
 */
export const Default: Story = {
	render: ( { columns } ) => (
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
	),
	args: { columns: 2 },
};

/**
 * A constrained container always renders the compact row layout, regardless of
 * the viewport, because the query tracks the container's width.
 */
export const NarrowContainer: Story = {
	render: ( { columns } ) => (
		<div style={ { maxWidth: '360px' } }>
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
		</div>
	),
	args: { columns: 2 },
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
};
