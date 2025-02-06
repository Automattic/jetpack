import React from 'react';
import Notice from '../index.jsx';

export default {
	title: 'Plugins/Protect/Notice',
	component: Notice,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		Story => (
			<div style={ { width: 250 } }>
				<Story />
			</div>
		),
	],
};

const Template = args => <Notice { ...args } />;

export const Default = Template.bind( {} );
Default.args = {
	type: 'success',
	message: 'Code is poetry.',
};

export const Dismissable = Template.bind( {} );
Dismissable.args = {
	type: 'success',
	dismissable: true,
	message: 'Dismiss this notice by clicking the close icon.',
};

export const Duration = Template.bind( {} );
Duration.args = {
	type: 'success',
	duration: 5000,
	message: 'This notice will self-destruct in five seconds.',
};
