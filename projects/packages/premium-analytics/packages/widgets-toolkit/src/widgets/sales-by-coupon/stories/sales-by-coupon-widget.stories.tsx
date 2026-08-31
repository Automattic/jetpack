import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { WidgetRootContext } from '../../../components/widget-root/context';
import { withWidgetRoot } from '../../../stories/with-widget-root';
import { SalesByCouponWidget } from '../sales-by-coupon-widget';
import type { Meta, StoryObj, Decorator } from '@storybook/react';

const meta: Meta< typeof SalesByCouponWidget > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Widgets/SalesByCoupon',
	component: SalesByCouponWidget,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Displays revenue distribution by coupon using a bar chart. Shows top 3 coupons plus "Other" segment with comparison support.',
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

type Story = StoryObj< typeof SalesByCouponWidget >;

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
 * Uses extreme data (long labels, large values) with comparison enabled.
 * Breakpoints aligned with Tailwind container query defaults (ARC-464).
 *
 * @see https://linear.app/a8c/issue/ARC-464/design-system-wide-responsiveness
 * @see https://linear.app/a8c/issue/WOOA7S-869
 */

/**
 * Creates a decorator that wraps the story in a fixed-size container
 * with comparison enabled and extreme data.
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
