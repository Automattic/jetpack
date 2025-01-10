import type { Meta } from '@storybook/react';
import CollapsibleMeta from '../collapsible-meta';
import React from 'react';

const meta: Meta< typeof CollapsibleMeta > = {
	title: 'Plugins/Boost/Features/UI/CollapsibleMeta',
	component: CollapsibleMeta,
	argTypes: {
		onToggleHandler: { control: false },
		tracksEvent: { control: 'text' },
		extraButtons: { control: false },
		headerText: { control: 'text' },
		toggleText: { control: 'text' },
		header: { control: 'text' },
		summary: { control: 'text' },
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
	toggleText: 'Edit',
	extraButtons: <button>Extra Button</button>,
	headerText: 'Header Text',
	tracksEvent: 'storybook_tracks_event',
	onToggleHandler: () => {},
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
