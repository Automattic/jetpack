import { action } from '@storybook/addon-actions';
import ClipboardButtonInput from '..';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'Packages/VideoPress/Clipboard Button Input',
	component: ClipboardButtonInput,
} as Meta< typeof ClipboardButtonInput >;

const Template: StoryFn< typeof ClipboardButtonInput > = args => {
	return <ClipboardButtonInput { ...args } />;
};

export const _default = Template.bind( {} );
_default.args = {
	text: 'Lorem Ipsum...',
	value:
		"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make ",
	onCopy: action( 'onCopy' ),
	resetTime: 3000,
};
