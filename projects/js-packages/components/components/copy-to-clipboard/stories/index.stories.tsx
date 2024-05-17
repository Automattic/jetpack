import CopyToClipboard from '../index';
import type { StoryFn, Meta } from '@storybook/react';

export default {
	title: 'JS Packages/Components/CopyToClipboard',
	component: CopyToClipboard,
} as Meta< typeof CopyToClipboard >;

const Template: StoryFn< typeof CopyToClipboard > = args => <CopyToClipboard { ...args } />;
export const _default = Template.bind( {} );
_default.args = {
	textToCopy: 'Some text to copy',
};

export const IconText = Template.bind( {} );
IconText.args = {
	buttonStyle: 'icon-text',
	textToCopy: 'Some text to copy',
};

export const OnlyText = Template.bind( {} );
OnlyText.args = {
	buttonStyle: 'text',
	textToCopy: 'Some text to copy',
};
