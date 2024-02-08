import styles from './styles.module.scss';

type CheckboxProps = {
	id: string;
	checked?: boolean;
	onChange?: React.ChangeEventHandler< HTMLInputElement >;
};

export const Checkbox: React.FC< CheckboxProps > = props => {
	const { id, checked, onChange } = props;

	return (
		<input
			id={ id }
			className={ styles.checkbox }
			type="checkbox"
			checked={ checked }
			onChange={ onChange }
		/>
	);
};
