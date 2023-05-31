import React, { useCallback, useState } from 'react';
import FormToggle from '..';

export default {
	title: 'Plugins/Protect/FormToggle',
	component: FormToggle,
};

const Template = args => {
	const [ checked, setChecked ] = useState( args.checked );

	const handleChecked = useCallback( () => {
		setChecked( ! checked );
	}, [ checked ] );

	return <FormToggle { ...args } checked={ checked } onChange={ handleChecked } />;
};

export const Default = Template.bind( {} );
Default.args = {
	checked: false,
	disabled: false,
};

export const DisabledOff = Template.bind( {} );
DisabledOff.args = {
	checked: false,
	disabled: true,
};

export const DisabledOn = Template.bind( {} );
DisabledOn.args = {
	checked: true,
	disabled: true,
};
