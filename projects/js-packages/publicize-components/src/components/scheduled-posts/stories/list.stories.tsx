import { Connection } from '../../../social-store/types';
import { ScheduledPostsList, ScheduledPostsListProps } from '../list';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Publicize Components/Scheduled Post/List',
	component: ScheduledPostsList,
} satisfies Meta< typeof ScheduledPostsList >;

// Export additional stories using pre-defined values
const Template: StoryFn< typeof ScheduledPostsList > = args => <ScheduledPostsList { ...args } />;

const DefaultArgs: ScheduledPostsListProps = {
	items: [
		{
			id: 1234,
			connection: {
				display_name: 'Matt Mullenweg',
				profile_picture:
					'https://gravatar.com/avatar/5a5f21e099ba62ae525e62cd1ad859985c8170b8811431e7fa6ccbc9da22405b',
				service_name: 'tumblr',
			} as Connection,
			scheduledAt: Math.floor( new Date().getTime() / 1000 ) + 86400,
		},
		{
			id: 4567,
			connection: {
				display_name: 'Matt Mullenweg',
				profile_picture:
					'https://gravatar.com/avatar/5a5f21e099ba62ae525e62cd1ad859985c8170b8811431e7fa6ccbc9da22405b',
				service_name: 'bluesky',
			} as Connection,
			scheduledAt: Math.floor( new Date().getTime() / 1000 ) + 86400,
		},
		{
			id: 6789,
			connection: {
				display_name: 'Matt Mullenweg',
				profile_picture:
					'https://gravatar.com/avatar/5a5f21e099ba62ae525e62cd1ad859985c8170b8811431e7fa6ccbc9da22405b',
				service_name: 'mastodon',
			} as Connection,
			scheduledAt: Math.floor( new Date().getTime() / 1000 ) + 86400,
		},
	],
	onDelete: () => {},
};

// Export Default story
export const _default = Template.bind( {} );

_default.args = DefaultArgs;
