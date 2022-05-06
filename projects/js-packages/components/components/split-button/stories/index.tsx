/**
 * Internal dependencies
 */
import SplitButton from '../index';

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
				onClick: () => {},
			},
			{
				title: 'Add to wishlist',
				icon: null,
				onClick: () => {},
			},
		],
	},
	parameters: {
		backgrounds: {
			default: 'dark',
		},
	},
};

const Template = args => <SplitButton { ...args }>Buy now!</SplitButton>;

export const _default = Template.bind( {} );
