import DecorativeCard from '../index.tsx';
import type { StoryFn, Meta } from '@storybook/react';

// Stand-in for the photograph the real usages pass, so the image pane does not
// render as an empty grey box in Storybook.
const imageUrl =
	"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='360' height='280'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%23069e08'/><stop offset='1' stop-color='%23004a4a'/></linearGradient></defs><rect width='360' height='280' fill='url(%23g)'/></svg>";

const meta: Meta< typeof DecorativeCard > = {
	title: 'JS Packages/Components/Decorative Card',
	component: DecorativeCard,
	args: {
		imageUrl,
	},
};

export default meta;

// Export additional stories using pre-defined values
const Template: StoryFn< typeof DecorativeCard > = args => <DecorativeCard { ...args } />;

// Export Default story
export const _default = Template.bind( {} );

export const Unlink = Template.bind( {} );
Unlink.args = {
	icon: 'unlink',
};

export const Vertical = Template.bind( {} );
Vertical.args = {
	format: 'vertical',
};
