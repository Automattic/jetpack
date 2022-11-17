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

export const Default = () => <Notice type="success" message="Code is poetry." />;
