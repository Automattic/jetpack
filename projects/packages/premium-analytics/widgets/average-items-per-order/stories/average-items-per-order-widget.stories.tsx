import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { registerReportMocks } from '../../../packages/widgets-toolkit/src/stories/mocks/register-report-mocks';
import AverageItemsPerOrderRender from '../render';
import type { Meta, StoryObj, Decorator } from '@storybook/react';

registerReportMocks();

const meta: Meta< typeof AverageItemsPerOrderRender > = {
	title: 'Packages/Premium Analytics/Widgets/AverageItemsPerOrder',
	component: AverageItemsPerOrderRender,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Dashboard widget that displays the average number of items per order with an optional comparison period and sparkline.',
			},
		},
	},
	decorators: [
		Story => (
			<div style={ { width: '100%', height: '300px' } }>
				<Story />
			</div>
		),
	],
};

export default meta;

type Story = StoryObj< typeof AverageItemsPerOrderRender >;

export const Default: Story = {
	args: {
		attributes: {
			reportParams: getDefaultQueryParams(),
		},
	},
};

export const WithComparison: Story = {
	args: {
		attributes: {
			reportParams: getDefaultQueryParams( true ),
		},
	},
};

const createSizeDecorator = ( width: string, height = '300px' ): Decorator => {
	return Story => (
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
	);
};

export const SizeXXSmall: Story = {
	args: WithComparison.args,
	decorators: [ createSizeDecorator( '256px' ) ],
};

export const SizeMedium: Story = {
	args: WithComparison.args,
	decorators: [ createSizeDecorator( '448px' ) ],
};

export const SizeLarge: Story = {
	args: WithComparison.args,
	decorators: [ createSizeDecorator( '576px' ) ],
};
