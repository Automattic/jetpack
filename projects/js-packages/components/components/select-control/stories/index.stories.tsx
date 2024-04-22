import React, { useCallback, useState } from 'react';
import SelectControl from '..';

export default {
	title: 'JS Packages/Components/Select Control',
	component: SelectControl,
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		disabled: {
			control: 'boolean',
			defaultValue: false,
			description: 'Whether or not the select control is currently disabled.',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: false },
			},
		},
		help: {
			control: 'text',
			description: 'Additional information to display below the select control.',
		},
		label: {
			control: 'text',
			description: 'The label for the select control.',
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
	{ label: 'Three', value: 'three' },
];

export const Default = args => {
	const [ selected, setSelected ] = useState( 'one' );

	const handleChange = useCallback( value => {
		setSelected( value );
	}, [] );

	return (
		<SelectControl
			{ ...args }
			selected={ selected }
			options={ options }
			onChange={ handleChange }
		/>
	);
};
