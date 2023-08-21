import classnames from 'classnames';
import styles from './styles.module.scss';

type CheckboxProps = {
	id: string;
	checked?: boolean;
	decorative?: boolean;
	onChange?: React.ChangeEventHandler< HTMLInputElement >;
};

export const Checkbox: React.FC< CheckboxProps > = props => {
	const { id, checked, decorative, onChange } = props;

	return (
		<input
			id={ id }
			className={ classnames( styles.checkbox, { [ styles.decorative ]: decorative } ) }
			type="checkbox"
			checked={ checked }
			onChange={ onChange }
			disabled={ decorative }
			aria-hidden={ decorative }
		/>
	);
};
