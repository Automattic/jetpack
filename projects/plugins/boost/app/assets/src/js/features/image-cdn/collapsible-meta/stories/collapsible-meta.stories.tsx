import type { Meta } from '@storybook/react';
import CollapsibleMeta from '../collapsible-meta';
import React from 'react';

const meta: Meta< typeof CollapsibleMeta > = {
	title: 'Plugins/Boost/Image CDN/CollapsibleMeta',
	component: CollapsibleMeta,
	argTypes: {
		header: { control: 'text' },
		summary: { control: 'text' },
		editText: { control: 'text' },
		closeEditText: { control: 'text' },
	},
	decorators: [
		Story => (
			<div style={ { maxWidth: '800px', margin: '200px auto', fontSize: '16px' } }>
				<Story />
			</div>
		),
	],
};

const defaultValues = {
	header: 'Something to show in the header',
	summary: 'Something to show in the summary',
	editText: 'Edit',
	closeEditText: 'Close',
};

export default meta;

const Template = args => {
	return (
		<CollapsibleMeta { ...args }>
			<div>Hello World!</div>
		</CollapsibleMeta>
	);
};
export const _default = Template.bind( {} );
_default.args = defaultValues;
