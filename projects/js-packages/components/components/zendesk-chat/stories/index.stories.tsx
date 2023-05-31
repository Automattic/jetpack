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

const Template = args => <ZendeskChat { ...args } />;

export const _default = Template.bind( {} );
