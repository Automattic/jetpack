import styles from './styles.module.scss';

const Textarea = ( {
	disabled = false,
	id,
	label = '',
	placeholder = '',
	rows = 3,
	value = '',
	onChange = () => {},
} ) => {
	return (
		<div>
			{ Boolean( label ) && (
				<label className={ styles.label } htmlFor={ id }>
					{ label }
				</label>
			) }
			<textarea
				className={ styles.textarea }
				disabled={ disabled }
				placeholder={ placeholder }
				rows={ rows }
				id={ id }
				name={ id }
				onChange={ onChange }
				value={ value ? value : '' }
			/>
		</div>
	);
};

export default Textarea;
