import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { WidgetRootContext } from '../../../components/widget-root/context';
import { withWidgetRoot } from '../../../stories/with-widget-root';
import { BookingOrderMetricWidget } from '../booking-order-metric-widget';
import type { Meta, StoryObj, Decorator } from '@storybook/react';

const meta: Meta< typeof BookingOrderMetricWidget > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Widgets/BookingOrderMetricWidget',
	component: BookingOrderMetricWidget,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Displays booking order metrics over time with comparison support. Automatically filters data to show only booking product types (booking, bookable-event, bookable-service).',
			},
		},
	},
	decorators: [
		withWidgetRoot(),
		Story => (
			<div style={ { width: '100%', height: '300px' } }>
				<Story />
			</div>
		),
	],
};

export default meta;

type Story = StoryObj< typeof BookingOrderMetricWidget >;

/**
 * Default state showing booking orders count (used by bookings-over-time widget)
 */
export const Default: Story = {
	args: {
		metricKey: 'orders_no',
	},
};

/**
 * With comparison period enabled - shows delta between periods
 */
export const WithComparison: Story = {
	args: {
		metricKey: 'orders_no',
	},
	decorators: [
		Story => (
			<WidgetRootContext.Provider value={ { reportParams: getDefaultQueryParams( true ) } }>
				<Story />
			</WidgetRootContext.Provider>
		),
	],
};

/*
 * Container Size Stories
 *
 * These stories demonstrate how the widget adapts to different container sizes.
 * Breakpoints aligned with Tailwind container query defaults.
 */

/**
 * Creates a decorator that wraps the story in a fixed-size container
 * with comparison enabled.
 *
 * Height is required because the chart uses height: 100% which needs
 * a parent with explicit height to resolve properly.
 */
const createSizeDecorator = ( width: string, height = '290px' ): Decorator => {
	return Story => (
		<WidgetRootContext.Provider value={ { reportParams: getDefaultQueryParams( true ) } }>
			<div
				style={ {
					width,
					height,
					border: '1px dashed #ccc',
					borderRadius: '8px',
					padding: '16px',
					background: '#fafafa',
					containerType: 'inline-size',
					containerName: 'widget',
				} }
			>
				<Story />
			</div>
		</WidgetRootContext.Provider>
	);
};

/**
 * Extra extra small container (256px / xxs breakpoint)
 */
export const SizeXXSmall: Story = {
	args: {
		metricKey: 'orders_no',
	},
	decorators: [ createSizeDecorator( '256px' ) ],
};

/**
 * Medium container (448px / md breakpoint)
 */
export const SizeMedium: Story = {
	args: {
		metricKey: 'orders_no',
	},
	decorators: [ createSizeDecorator( '448px' ) ],
};

/**
 * Large container (576px / xl breakpoint)
 */
export const SizeLarge: Story = {
	args: {
		metricKey: 'orders_no',
	},
	decorators: [ createSizeDecorator( '576px' ) ],
};
