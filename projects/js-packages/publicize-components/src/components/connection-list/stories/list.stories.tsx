/* istanbul ignore file -- Ignore code coverage */
import { useCallback, useState } from '@wordpress/element';
import { Connection } from '../../../social-store/types';
import { ConnectionList, ConnectionListProps } from '../list';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Publicize Components/Connection List/List',
	component: ConnectionList,
} satisfies Meta< typeof ConnectionList >;

// Create an interactive template with toggling functionality
const Template: StoryFn< typeof ConnectionList > = args => {
	const [ connections, setConnections ] = useState( args.connections );

	const handleToggle = useCallback( ( connectionId: string ) => {
		setConnections( prevConnections =>
			prevConnections.map( connection =>
				connection.connection_id === connectionId
					? { ...connection, enabled: ! connection.enabled }
					: connection
			)
		);
	}, [] );

	return (
		<ConnectionList connections={ connections } onToggle={ handleToggle } title={ args.title } />
	);
};

const DefaultArgs: ConnectionListProps = {
	connections: [
		{
			display_name: 'Matt Mullenweg',
			profile_picture:
				'https://gravatar.com/avatar/5a5f21e099ba62ae525e62cd1ad859985c8170b8811431e7fa6ccbc9da22405b',
			connection_id: '1234',
			service_name: 'tumblr',
			enabled: true,
		} as Connection,
		{
			display_name: 'Matt Mullenweg',
			profile_picture:
				'https://gravatar.com/avatar/5a5f21e099ba62ae525e62cd1ad859985c8170b8811431e7fa6ccbc9da22405b',
			connection_id: '4567',
			service_name: 'bluesky',
			enabled: false,
		} as Connection,
		{
			display_name: 'Matt Mullenweg',
			profile_picture:
				'https://gravatar.com/avatar/5a5f21e099ba62ae525e62cd1ad859985c8170b8811431e7fa6ccbc9da22405b',
			connection_id: '6789',
			service_name: 'mastodon',
			enabled: true,
		} as Connection,
	],
	onToggle: () => {},
	title: 'Select where to share',
};

// Export Default story
export const _default = Template.bind( {} );
_default.args = DefaultArgs;

export const NoTitle = Template.bind( {} );
NoTitle.args = {
	...DefaultArgs,
	title: undefined,
};
