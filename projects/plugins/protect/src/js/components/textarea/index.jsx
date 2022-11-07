import styles from './styles.module.scss';

const Textarea = ( {
	disabled = false,
	id,
	label = '',
	placeholder = '',
	rows = 3,
	value = '',
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
			>
				{ value }
			</textarea>
		</div>
	);
};

export default Textarea;
