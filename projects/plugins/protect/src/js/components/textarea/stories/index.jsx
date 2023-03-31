import React from 'react';
import Textarea from '..';

export default {
	title: 'Plugins/Protect/Textarea',
	component: Textarea,
};

export const Default = () => (
	<Textarea label="Textarea" placeholder="Code is poetry." id="default" />
);

export const Disabled = () => (
	<Textarea label="Disabled Textarea" id="disabled" disabled>
		Code is poetry.
	</Textarea>
);
