import styles from './styles.module.scss';

export const Section = ( { children } ) => {
	return <div className={ styles.section }>{ children }</div>;
};
