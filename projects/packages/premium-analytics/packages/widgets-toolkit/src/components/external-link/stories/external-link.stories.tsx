import { ExternalLink } from '../external-link';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof ExternalLink > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/ExternalLink',
	component: ExternalLink,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					"Link to a page outside the dashboard. It opens in a new tab and carries the design system's outbound marker.",
			},
		},
	},
	args: {
		href: 'https://example.com/hello-world/',
		children: 'Hello world',
	},
};

export default meta;

type Story = StoryObj< typeof ExternalLink >;

/**
 * The house style: the link inherits the surrounding text colour.
 */
export const Unstyled: Story = {};

/**
 * The design system's own link colours, for a link inside running text.
 */
export const Default: Story = {
	args: { variant: 'default' },
};
