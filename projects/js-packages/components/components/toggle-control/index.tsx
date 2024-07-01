import { ToggleControl as WPToggleControl } from '@wordpress/components';
import clsx from 'clsx';
import { useCallback } from 'react';
import styles from './styles.module.scss';

interface ToggleControlProps {
	/** Whether or not the toggle is currently enabled. */
	checked?: boolean;

	/** Custom class name to append to the component. */
	className?: string;

	/** Whether or not the toggle is currently disabled. */
	disabled?: boolean;

	/** Additional information to display below the toggle. */
	help?: React.ReactNode;

	/** Whether or not the toggling is currently toggling. */
	toggling?: boolean;

	/** The label for the toggle. */
	label?: React.ReactNode;

	/** The size of the toggle. */
	size?: 'small' | 'normal';

	/** A callback function invoked when the toggle is clicked. */
	onChange: ( value: boolean ) => void;
}

const ToggleControl: React.FC< ToggleControlProps > = ( {
	checked,
	className,
	disabled,
	help,
	toggling,
	label,
	size = 'normal',
	onChange,
} ) => {
	const showChecked =
		toggling !== undefined ? ( checked && ! toggling ) || ( ! checked && toggling ) : checked;

	const handleOnChange = useCallback(
		( value: boolean ) => {
			// Don't toggle if the toggle is already toggling.
			if ( toggling ) {
				return;
			}

			onChange( value );
		},
		[ toggling, onChange ]
	);

	return (
		<WPToggleControl
			checked={ showChecked }
			className={ clsx( styles.toggle, className, {
				[ styles[ 'is-toggling' ] ]: toggling,
				[ styles[ 'is-small' ] ]: size === 'small',
				[ styles[ 'no-label' ] ]: ! label,
			} ) }
			disabled={ disabled }
			help={ help }
			label={ label }
			onChange={ handleOnChange }
		/>
	);
};

export default ToggleControl;
