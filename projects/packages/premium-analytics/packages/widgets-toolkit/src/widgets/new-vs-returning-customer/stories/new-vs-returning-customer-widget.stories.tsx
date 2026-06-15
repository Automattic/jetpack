import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { WidgetRootContext } from '../../../components/widget-root/context';
import { withWidgetRoot } from '../../../stories/with-widget-root';
import { NewVsReturningCustomerWidget } from '../new-vs-returning-customer-widget';
import type { Meta, StoryObj, Decorator } from '@storybook/react';

const meta: Meta< typeof NewVsReturningCustomerWidget > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Widgets/NewVsReturningCustomer',
	component: NewVsReturningCustomerWidget,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Displays unique customer counts broken down by new vs returning customers using a donut chart. Shows total customers with comparison support.',
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

type Story = StoryObj< typeof NewVsReturningCustomerWidget >;

/**
 * Default state with mock data (no comparison)
 */
export const Default: Story = {};

/**
 * With comparison period enabled
 */
export const WithComparison: Story = {
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
 * Breakpoints aligned with Tailwind container query defaults (ARC-464).
 *
 * @see https://linear.app/a8c/issue/ARC-464/design-system-wide-responsiveness
 * @see https://linear.app/a8c/issue/WOOA7S-869
 */

/**
 * Creates a decorator that wraps the story in a fixed-size container
 * with comparison enabled.
 */
const createSizeDecorator = ( width: string ): Decorator => {
	return Story => (
		<WidgetRootContext.Provider value={ { reportParams: getDefaultQueryParams( true ) } }>
			<div
				style={ {
					width,
					height: '300px',
					border: '1px dashed #ccc',
					borderRadius: '8px',
					padding: '16px',
					background: '#fafafa',
				} }
			>
				<Story />
			</div>
		</WidgetRootContext.Provider>
	);
};

/**
 * Extra extra small widgets (256px / xxs breakpoint)
 * Tests compact layout with comparison enabled.
 */
export const SizeXXSmall: Story = {
	decorators: [ createSizeDecorator( '256px' ) ],
};

/**
 * Medium container (448px / md breakpoint)
 * Tests standard tile size with comparison.
 */
export const SizeMedium: Story = {
	decorators: [ createSizeDecorator( '448px' ) ],
};

/**
 * Large container (576px / xl breakpoint)
 * Tests expanded layout with full data visibility.
 */
export const SizeLarge: Story = {
	decorators: [ createSizeDecorator( '576px' ) ],
};
