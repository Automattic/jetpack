import { device, location, customer, payment } from '@jetpack-premium-analytics/icons';
import { ChartEmptyState } from '../chart-empty-state';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof ChartEmptyState > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/ChartEmptyState',
	component: ChartEmptyState,
	tags: [ 'autodocs' ],
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component:
					'A reusable empty state component for charts. With no props it renders the generic "no results for this time period" state (the search magnifier from @jetpack-premium-analytics/icons), with support for other illustrated icons from the same package.',
			},
		},
	},
	argTypes: {
		icon: {
			control: false,
			description:
				'Icon to display in the empty state. Defaults to the search magnifier from @jetpack-premium-analytics/icons. Can be overridden with custom icons, or `null` for none.',
		},
		text: {
			control: 'text',
			description: 'Text to display in the empty state.',
		},
	},
};

export default meta;

type Story = StoryObj< typeof ChartEmptyState >;

/**
 * Widget card wrapper component for Storybook stories.
 * Simulates a widget container to demonstrate how ChartEmptyState
 * appears within typical widget dimensions.
 */
const WidgetCard = ( {
	title,
	children,
	width = '300px',
	height = '280px',
}: {
	title: string;
	children: React.ReactNode;
	width?: string;
	height?: string;
} ) => (
	<div
		style={ {
			width,
			height,
			border: '1px solid var(--wpds-color-stroke-surface-neutral-weak)',
			borderRadius: 'var(--wpds-border-radius-md)',
			background: 'var(--wpds-color-background-surface-neutral)',
			display: 'flex',
			flexDirection: 'column',
			overflow: 'hidden',
		} }
	>
		<div
			style={ {
				padding: 'var(--wpds-dimension-gap-lg)',
				borderBottom: '1px solid var(--wpds-color-stroke-surface-neutral-weak)',
				fontWeight: 600,
				fontSize: 'var(--wpds-typography-font-size-sm)',
				color: 'var(--wpds-color-foreground-content-neutral)',
			} }
		>
			{ title }
		</div>
		<div style={ { flex: 1, display: 'flex' } }>{ children }</div>
	</div>
);

/**
 * Default: the generic "no results for this time period" state
 */
export const Default: Story = {
	args: {},
	decorators: [
		Story => (
			<WidgetCard title="Widget Title">
				<Story />
			</WidgetCard>
		),
	],
};

/**
 * Empty state with custom icon and text
 */
export const Custom: Story = {
	args: {
		text: 'No payments found for this period.',
		icon: payment,
	},
	decorators: [
		Story => (
			<WidgetCard title="Custom Empty State">
				<Story />
			</WidgetCard>
		),
	],
};

/**
 * Different Container Sizes
 *
 * Shows how the empty state adapts to different widget sizes,
 * featuring different domain icons (customer, device, location).
 */
export const ContainerSizes: Story = {
	render: () => (
		<div
			style={ {
				display: 'flex',
				gap: 'var(--wpds-dimension-gap-xl)',
				alignItems: 'flex-start',
				flexWrap: 'wrap',
			} }
		>
			<WidgetCard title="Small (256px)" width="256px" height="200px">
				<ChartEmptyState icon={ customer } />
			</WidgetCard>
			<WidgetCard title="Medium (350px)" width="350px" height="280px">
				<ChartEmptyState icon={ device } />
			</WidgetCard>
			<WidgetCard title="Large (450px)" width="450px" height="350px">
				<ChartEmptyState icon={ location } />
			</WidgetCard>
		</div>
	),
};
