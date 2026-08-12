import { GenericSkeleton } from '../generic-skeleton';
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Widget card wrapper, simulating a dashboard widget container so the skeleton
 * is shown within typical widget dimensions.
 */
const WidgetCard = ( { height, children }: { height: string; children: React.ReactNode } ) => (
	<div
		style={ {
			width: '360px',
			height,
			border: '1px solid var(--wpds-color-stroke-surface-neutral-weak)',
			borderRadius: 'var(--wpds-border-radius-md)',
			background: 'var(--wpds-color-background-surface-neutral)',
			display: 'flex',
			flexDirection: 'column',
			overflow: 'hidden',
		} }
	>
		<div style={ { position: 'relative', flex: 1, minHeight: 0 } }>{ children }</div>
	</div>
);

const meta: Meta< typeof GenericSkeleton > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/WidgetSkeleton',
	component: GenericSkeleton,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					"Fallback loading shape for widgets with no content-specific skeleton. Content-shaped skeletons pass their own shape through `WidgetState`'s `renderLoading`.",
			},
		},
	},
};

export default meta;

type Story = StoryObj< typeof GenericSkeleton >;

export const Default: Story = {
	render: () => (
		<WidgetCard height="320px">
			<GenericSkeleton />
		</WidgetCard>
	),
};

/**
 * A height-1 dashboard tile. The shape must stay inside the body instead of
 * overflowing into the widget footer.
 */
export const ShortTile: Story = {
	render: () => (
		<WidgetCard height="140px">
			<GenericSkeleton />
		</WidgetCard>
	),
};
