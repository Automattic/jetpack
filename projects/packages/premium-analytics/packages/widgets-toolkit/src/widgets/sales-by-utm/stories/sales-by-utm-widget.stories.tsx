import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { withWidgetRoot } from '../../../stories/with-widget-root';
import { SalesByUtmWidget } from '../sales-by-utm-widget';
import type { Meta, StoryObj, Decorator } from '@storybook/react';

const meta: Meta< typeof SalesByUtmWidget > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Widgets/SalesByUtm',
	component: SalesByUtmWidget,
	tags: [ 'autodocs' ],
	decorators: [ withWidgetRoot( getDefaultQueryParams( true ) ) ],
	argTypes: {
		view: {
			control: 'select',
			options: [ 'source', 'channel', 'campaign' ],
			description: 'The order attribution view to display',
		},
	},
	parameters: {
		docs: {
			description: {
				component:
					'Displays a leaderboard chart showing sales breakdown by UTM parameters. Supports three views: source (referral source), channel (marketing channel), and campaign (campaign name).',
			},
		},
	},
};

export default meta;

type Story = StoryObj< typeof SalesByUtmWidget >;

/**
 * Sales by Source - shows referral sources driving sales
 */
export const Source: Story = {
	args: {
		view: 'source',
	},
};

/**
 * Sales by Channel - shows marketing channels driving sales
 */
export const Channel: Story = {
	args: {
		view: 'channel',
	},
};

/**
 * Sales by Campaign - shows campaign performance
 */
export const Campaign: Story = {
	args: {
		view: 'campaign',
	},
};

/*
 * Container Size Stories
 *
 * These stories demonstrate how the widget adapts to different container sizes.
 * Uses source view with comparison enabled.
 * Breakpoints aligned with Tailwind container query defaults (ARC-464).
 *
 * @see https://linear.app/a8c/issue/ARC-464/design-system-wide-responsiveness
 * @see https://linear.app/a8c/issue/WOOA7S-869
 */

/**
 * Creates a decorator that wraps the story in a fixed-size container.
 * Context is provided by the meta-level decorator.
 */
const createSizeDecorator = ( width: string ): Decorator => {
	return Story => (
		<div
			style={ {
				width,
				border: '1px dashed #ccc',
				borderRadius: '8px',
				padding: '16px',
				background: '#fafafa',
			} }
		>
			<Story />
		</div>
	);
};

/**
 * Small container (280px / xs breakpoint)
 * Tests compact layout with comparison enabled.
 */
export const SizeSmall: Story = {
	args: {
		view: 'source',
	},
	decorators: [ createSizeDecorator( '280px' ) ],
};

/**
 * Medium container (448px / md breakpoint)
 * Tests standard tile size with comparison.
 */
export const SizeMedium: Story = {
	args: {
		view: 'source',
	},
	decorators: [ createSizeDecorator( '448px' ) ],
};

/**
 * Large container (640px / xl breakpoint)
 * Tests expanded layout with full data visibility.
 */
export const SizeLarge: Story = {
	args: {
		view: 'source',
	},
	decorators: [ createSizeDecorator( '640px' ) ],
};
