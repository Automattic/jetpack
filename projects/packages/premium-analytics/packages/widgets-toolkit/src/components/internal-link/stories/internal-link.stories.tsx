/**
 * Internal dependencies
 */
import { withStoryRouter } from '../../../../../../widgets/stories/with-story-router';
import { InternalLink } from '../internal-link';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof InternalLink > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/InternalLink',
	component: InternalLink,
	tags: [ 'autodocs' ],
	decorators: [ withStoryRouter ],
	parameters: {
		docs: {
			description: {
				component:
					'Link to a route inside the dashboard. It navigates through the router, so the dashboard does not reload.',
			},
		},
	},
	args: {
		to: '/reports/$report',
		params: { report: 'posts' },
		children: 'View all posts',
	},
};

export default meta;

type Story = StoryObj< typeof InternalLink >;

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
