import ZendeskChat from '../index.tsx';

export default {
	title: 'JS Packages/Components/Zendesk Chat',
	component: ZendeskChat,
};

const Template = args => <ZendeskChat { ...args } />;

export const _default = Template.bind( {} );
