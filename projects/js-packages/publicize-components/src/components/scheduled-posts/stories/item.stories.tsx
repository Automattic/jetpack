import { Connection } from '../../../social-store/types';
import { ScheduledPostItem, ScheduledPostItemProps } from '../item';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Publicize Components/Scheduled Post/Item',
	component: ScheduledPostItem,
} satisfies Meta< typeof ScheduledPostItem >;

// Export additional stories using pre-defined values
const Template: StoryFn< typeof ScheduledPostItem > = args => <ScheduledPostItem { ...args } />;

const DefaultArgs: ScheduledPostItemProps = {
	connection: {
		display_name: 'Matt Mullenweg',
		profile_picture:
			'https://gravatar.com/avatar/5a5f21e099ba62ae525e62cd1ad859985c8170b8811431e7fa6ccbc9da22405b',
		connection_id: '1234',
		service_name: 'tumblr',
	} as Connection,
	scheduledAt: Math.floor( new Date().getTime() / 1000 ) + 86400,
	onDelete: () => {},
};

// Export Default story
export const _default = Template.bind( {} );

_default.args = DefaultArgs;
