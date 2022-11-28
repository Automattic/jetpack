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

export const Dismissable = () => (
	<Notice
		type="success"
		dismissable={ true }
		message="Dismiss this notice by clicking the close icon."
	/>
);

export const Duration = () => (
	<Notice
		type="success"
		duration={ 5000 }
		message="This notice will self-destruct in five seconds."
	/>
);
