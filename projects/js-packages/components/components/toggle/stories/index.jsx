import React, { useCallback, useState } from 'react';
import Toggle from '..';

export default {
	title: 'JS Packages/Components/Toggle',
	component: Toggle,
	parameters: {
		layout: 'centered',
	},
};

export const Default = () => {
	const [ checked, setChecked ] = useState( false );

	const handleChecked = useCallback( () => {
		setChecked( ! checked );
	}, [ checked ] );

	return (
		<Toggle
			checked={ checked }
			children={ <span>Code is poetry.</span> }
			onChange={ handleChecked }
		/>
	);
};

export const DisabledOff = () => {
	const [ checked, setChecked ] = useState( false );

	const handleChecked = useCallback( () => {
		setChecked( ! checked );
	}, [ checked ] );

	return (
		<Toggle
			checked={ checked }
			disabled
			disabledReason="This toggle is disabled."
			onChange={ handleChecked }
		/>
	);
};

export const DisabledOn = () => {
	const [ checked, setChecked ] = useState( true );

	const handleChecked = useCallback( () => {
		setChecked( ! checked );
	}, [ checked ] );

	return (
		<Toggle
			checked={ checked }
			disabled
			disabledReason="This toggle is disabled."
			onChange={ handleChecked }
		/>
	);
};
