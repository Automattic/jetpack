import styles from './styles.module.scss';
import type { ChangeEventHandler, FC } from 'react';

type CheckboxProps = {
	id: string;
	checked?: boolean;
	onChange?: ChangeEventHandler< HTMLInputElement >;
};

export const Checkbox: FC< CheckboxProps > = props => {
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
