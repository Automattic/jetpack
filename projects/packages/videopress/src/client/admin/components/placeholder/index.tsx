import styles from './style.module.scss';

const Placeholder = ( { children = null, width = null, height = null } ) => {
	return (
		<div className={ styles.placeholder } style={ { width, height } }>
			{ children }
		</div>
	);
};

export default Placeholder;
