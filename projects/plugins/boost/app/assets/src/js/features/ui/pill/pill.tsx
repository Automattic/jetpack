import styles from './pill.module.scss';

const Pill = ( { text }: { text: string } ) => {
	return <span className={ styles.pill }>{ text }</span>;
};

export default Pill;
