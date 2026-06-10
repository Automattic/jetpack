import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { WidgetRootContext } from '../../../components/widget-root/context';
import { withWidgetRoot } from '../../../stories/with-widget-root';
import { SessionsByDeviceWidget } from '../sessions-by-device-widget';
import type { Meta, StoryObj, Decorator } from '@storybook/react';

const meta: Meta< typeof SessionsByDeviceWidget > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Widgets/SessionsByDevice',
	component: SessionsByDeviceWidget,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Displays website sessions breakdown by device type (Mobile, Desktop, Tablet) using a semi-circle chart with comparison support.',
			},
		},
	},
	decorators: [ withWidgetRoot() ],
};

export default meta;

type Story = StoryObj< typeof SessionsByDeviceWidget >;

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

/**
 * Creates a decorator that wraps the story in a fixed-size container
 */
const createSizeDecorator = ( width: string ): Decorator => {
	return Story => (
		<WidgetRootContext.Provider value={ { reportParams: getDefaultQueryParams( true ) } }>
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
		</WidgetRootContext.Provider>
	);
};

/**
 * Small container (256px)
 */
export const SizeSmall: Story = {
	decorators: [ createSizeDecorator( '256px' ) ],
};

/**
 * Medium container (350px)
 */
export const SizeMedium: Story = {
	decorators: [ createSizeDecorator( '350px' ) ],
};

/**
 * Large container (450px)
 */
export const SizeLarge: Story = {
	decorators: [ createSizeDecorator( '450px' ) ],
};
