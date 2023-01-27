import React from 'react';
import ProgressBar from '../index.jsx';

export default {
	title: 'Plugins/Protect/Progress Bar',
	component: ProgressBar,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		Story => (
			<div style={ { width: 480 } }>
				<Story />
			</div>
		),
	],
};

export const Initial = () => <ProgressBar value={ 0 } />;
export const Halfway = () => <ProgressBar value={ 50 } />;
export const Complete = () => <ProgressBar value={ 100 } />;
