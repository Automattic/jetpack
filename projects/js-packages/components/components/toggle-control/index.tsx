import { ToggleControl as CalypsoToggleControl } from '@wordpress/components';
import classNames from 'classnames';
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

	/** The label for the toggle. */
	label?: React.ReactNode;

	/** A callback function invoked when the toggle is clicked. */
	onChange: ( value: boolean ) => void;
}

const ToggleControl: React.FC< ToggleControlProps > = ( {
	checked,
	className,
	disabled,
	help,
	label,
	onChange,
} ) => {
	return (
		<CalypsoToggleControl
			checked={ checked }
			className={ classNames( styles.toggle, className ) }
			disabled={ disabled }
			help={ help }
			label={ label }
			onChange={ onChange }
		/>
	);
};

export default ToggleControl;
