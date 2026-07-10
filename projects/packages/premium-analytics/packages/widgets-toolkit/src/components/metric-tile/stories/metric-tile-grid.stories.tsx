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
	argTypes: {
		columns: { control: { type: 'number', min: 1, max: 6 } },
	},
	parameters: {
		docs: {
			description: {
				component:
					'Responsive grid of metric tiles that follows the widget cell size: in a narrow ' +
					'or short container each metric renders as a compact row (icon and label on the ' +
					'left, value on the right). Wide containers use the configured maximum columns: ' +
					'large centered tiles when height allows, and a compact grid when height is tight.',
			},
		},
	},
} satisfies Meta< ComponentProps< typeof MetricTileGrid > >;

export default meta;

type Story = StoryObj< { columns: number } >;

function renderTiles( { columns }: { columns: number } ) {
	return <MetricTileGrid columns={ columns } tiles={ TILES } dataFormat={ COUNT_FORMAT } />;
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
 * viewport, because the grid follows its own rendered size.
 */
export const NarrowContainer: Story = {
	render: renderTiles,
	args: { columns: 2 },
	decorators: [ makeCanvas( '360px', '480px' ) ],
};

/**
 * A wide but short container renders a compact grid: enough columns to avoid
 * a long list, but tighter padding and value sizing than the large tile mode.
 */
export const ShortContainer: Story = {
	render: renderTiles,
	args: { columns: 2 },
	decorators: [ makeCanvas( '100%', '180px' ) ],
};

/**
 * Four columns keep card-style content so metric labels remain readable in a
 * single row.
 */
export const FourColumns: Story = {
	render: renderTiles,
	args: { columns: 4 },
	decorators: [ makeCanvas( '100%', '280px' ) ],
};

/**
 * A `null` value renders the placeholder ("—" by default) instead of a
 * formatted zero — for metrics a site doesn't have yet, like a rate that
 * cannot be computed.
 */
export const WithPlaceholderValue: Story = {
	render: ( { columns } ) => (
		<MetricTileGrid
			columns={ columns }
			tiles={ [
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
			] }
		/>
	),
	args: { columns: 2 },
	decorators: [ makeCanvas( '100%', '320px' ) ],
};
