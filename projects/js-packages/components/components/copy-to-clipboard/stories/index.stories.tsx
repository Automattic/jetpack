import CopyToClipboard from '../index.tsx';
import type { StoryFn, Meta } from '@storybook/react';

const meta: Meta< typeof CopyToClipboard > = {
	title: 'JS Packages/Components/CopyToClipboard',
	component: CopyToClipboard,
};

export default meta;

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
