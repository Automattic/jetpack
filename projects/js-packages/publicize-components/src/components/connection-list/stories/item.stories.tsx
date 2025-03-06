/* istanbul ignore file -- Ignore code coverage */
import { useCallback, useState } from '@wordpress/element';
import { Connection } from '../../../social-store/types';
import { ConnectionListItem, ConnectionListItemProps } from '../item';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Publicize Components/Connection List/Item',
	component: ConnectionListItem,
} satisfies Meta< typeof ConnectionListItem >;

const Template: StoryFn< typeof ConnectionListItem > = args => {
	const [ isEnabled, setIsEnabled ] = useState( args.connection.enabled );

	const handleToggle = useCallback( () => {
		setIsEnabled( ! isEnabled );
	}, [ isEnabled ] );

	const connection = {
		...args.connection,
		enabled: isEnabled,
	};

	return <ConnectionListItem connection={ connection } onToggle={ handleToggle } />;
};

const DefaultArgs: ConnectionListItemProps = {
	connection: {
		display_name: 'Matt Mullenweg',
		profile_picture:
			'https://gravatar.com/avatar/5a5f21e099ba62ae525e62cd1ad859985c8170b8811431e7fa6ccbc9da22405b',
		connection_id: '1234',
		service_name: 'tumblr',
		enabled: true,
	} as Connection,
	onToggle: () => {},
};

// Export Default story
export const _default = Template.bind( {} );

_default.args = DefaultArgs;
