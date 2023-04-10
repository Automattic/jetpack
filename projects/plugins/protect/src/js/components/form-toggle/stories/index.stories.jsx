import React, { useCallback, useState } from 'react';
import FormToggle from '..';

export default {
	title: 'Plugins/Protect/FormToggle',
	component: FormToggle,
};

export const Default = () => {
	const [ checked, setChecked ] = useState( false );

	const handleChecked = useCallback( () => {
		setChecked( ! checked );
	}, [ checked ] );

	return <FormToggle checked={ checked } onChange={ handleChecked } />;
};

export const DisabledOff = () => {
	const [ checked, setChecked ] = useState( false );

	const handleChecked = useCallback( () => {
		setChecked( ! checked );
	}, [ checked ] );

	return <FormToggle checked={ checked } onChange={ handleChecked } disabled />;
};

export const DisabledOn = () => {
	const [ checked, setChecked ] = useState( true );

	const handleChecked = useCallback( () => {
		setChecked( ! checked );
	}, [ checked ] );

	return <FormToggle checked={ checked } onChange={ handleChecked } disabled />;
};
