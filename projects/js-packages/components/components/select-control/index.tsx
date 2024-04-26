import { SelectControl as WPSelectControl } from '@wordpress/components';
import classNames from 'classnames';
import styles from './styles.module.scss';

interface SelectControlProps {
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

const RadioControl: React.FC< SelectControlProps > = ( {
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
		<WPSelectControl
			selected={ selected }
			className={ classNames( styles.radio, className ) }
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
