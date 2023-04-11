import ZendeskChat from '../index';

export default {
	title: 'JS Packages/Components/Zendesk Chat',
	component: ZendeskChat,
	parameters: {
		backgrounds: {
			default: 'dark',
		},
	},
};

const Template = () => <ZendeskChat />;

export const _default = Template.bind( {} );
