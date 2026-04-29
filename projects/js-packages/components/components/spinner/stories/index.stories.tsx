import Spinner from '../index.tsx';

export default {
	title: 'JS Packages/Components/Spinner (Deprecated)',
	component: Spinner,
	parameters: {
		docs: {
			description: {
				component:
					'**Deprecated:** Use `Spinner` from `@wordpress/components` instead. This component will be removed in a future release.',
			},
		},
	},
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
