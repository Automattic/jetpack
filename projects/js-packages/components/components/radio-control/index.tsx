import { RadioControl as WPRadioControl } from '@wordpress/components';
import clsx from 'clsx';
import styles from './styles.module.scss';

interface RadioControlProps {
	/** The current value. */
	selected: string;

	/** Custom class name to append to the component. */
	className?: string;

	/** Whether or not the radio control is currently disabled. */
	disabled?: boolean;

	/** Additional information to display below the radio control. */
	help?: React.ReactNode;

	/** The label for the radio control. */
	label?: React.ReactNode;

	/** If true, the label will only be visible to screen readers. */
	hideLabelFromVision?: boolean;

	/** A list of options to show. */
	options: { label: string; value: string }[];

	/** A callback function invoked when the value is changed. */
	onChange: ( value: string ) => void;
}

const RadioControl: React.FC< RadioControlProps > = ( {
	selected,
	className,
	disabled,
	help,
	label,
	hideLabelFromVision,
	options,
	onChange,
} ) => {
	return (
		<WPRadioControl
			selected={ selected }
			className={ clsx( styles.radio, className ) }
			disabled={ disabled }
			help={ help }
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
			options={ options }
			onChange={ onChange }
		/>
	);
};

export default RadioControl;
