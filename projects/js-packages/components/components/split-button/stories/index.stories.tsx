import SplitButton from '../index';
import type { ComponentStory, ComponentMeta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/Split Button',
	component: SplitButton,
	argTypes: {
		variant: { type: 'select', options: [ undefined, 'secondary', 'primary', 'tertiary', 'link' ] },
	},
	args: {
		controls: [
			{
				title: 'Add to cart',
				icon: null,
				onClick: () => null,
			},
			{
				title: 'Add to wishlist',
				icon: null,
				onClick: () => null,
			},
		],
	},
	parameters: {
		backgrounds: {
			default: 'dark',
		},
	},
} as ComponentMeta< typeof SplitButton >;

const Template: ComponentStory< typeof SplitButton > = args => (
	<SplitButton { ...args }>Buy now!</SplitButton>
);

export const _default = Template.bind( {} );
