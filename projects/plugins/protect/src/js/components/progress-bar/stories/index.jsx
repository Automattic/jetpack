import React from 'react';
import ProtectProgressBar from '../index.jsx';

export default {
	title: 'Plugins/Protect/Progress Bar',
	component: ProtectProgressBar,
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

export const Initial = () => <ProtectProgressBar progress={ 0 } />;
export const Halfway = () => <ProtectProgressBar progress={ 50 } />;
export const Complete = () => <ProtectProgressBar progress={ 100 } />;
