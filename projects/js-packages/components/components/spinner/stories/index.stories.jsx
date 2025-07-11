import Spinner from '../index.jsx';

export default {
	title: 'JS Packages/Components/Spinner',
	component: Spinner,
	argTypes: {
		color: { control: 'color' },
	},
	globals: {
		backgrounds: {
			value: 'dark',
		},
	},
};

const Template = args => <Spinner { ...args } />;

export const _default = Template.bind( {} );
