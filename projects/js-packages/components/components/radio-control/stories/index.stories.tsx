import React, { useCallback, useState } from 'react';
import RadioControl from '..';

export default {
	title: 'JS Packages/Components/Radio Control',
	component: RadioControl,
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		disabled: {
			control: 'boolean',
			defaultValue: false,
			description: 'Whether or not the radio control is currently disabled.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: false },
			},
		},
		help: {
			control: 'text',
			description: 'Additional information to display below the radio control.',
		},
		label: {
			control: 'text',
			description: 'The label for the radio control.',
		},
		hideLabelFromVision: {
			control: 'boolean',
			defaultValue: false,
			description: 'If true, the label will only be visible to screen readers.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: false },
			},
		},
	},
};

const options = [
	{ label: 'One', value: 'one' },
	{ label: 'Two', value: 'two' },
];

export const Default = args => {
	const [ selected, setSelected ] = useState( 'one' );

	const handleChange = useCallback( value => {
		setSelected( value );
	}, [] );

	return (
		<RadioControl { ...args } selected={ selected } options={ options } onChange={ handleChange } />
	);
};
