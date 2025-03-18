import ConnectionIcon from '../index.jsx';
import '../../../../../social-logos/src/social-logo-colors.css';

export default {
	title: 'JS Packages/Publicize Components/ConnectionIcon',
	component: ConnectionIcon,
	argTypes: {
		serviceName: {
			control: {
				type: 'select',
			},
			options: [
				'facebook',
				'x',
				'instagram',
				'linkedin',
				'nextdoor',
				'tumblr',
				'bluesky',
				'mastodon',
			],
		},
	},
};

const Template = args => <ConnectionIcon { ...args } />;

export const _default = Template.bind( {} );
_default.args = {
	serviceName: 'tumblr',
	label: 'Jetpack Social',
	checked: true,
	profilePicture:
		'https://gravatar.com/avatar/5a5f21e099ba62ae525e62cd1ad859985c8170b8811431e7fa6ccbc9da22405b',
};
