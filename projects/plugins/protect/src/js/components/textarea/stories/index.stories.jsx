import React from 'react';
import Textarea from '..';

export default {
	title: 'Plugins/Protect/Textarea',
	component: Textarea,
};

export const Default = args => <Textarea { ...args } />;
Default.args = {
	label: 'Textarea',
	placeholder: 'Code is poetry.',
	id: 'default',
};

export const Disabled = args => <Textarea { ...args } />;
Disabled.args = {
	label: 'Disabled Textarea',
	id: 'disabled',
	children: 'Code is poetry.',
};
