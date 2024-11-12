import clsx from 'clsx';
import styles from './pill.module.scss';

const Pill = ( { text, altVersion }: { text: string; altVersion?: boolean } ) => {
	return (
		<span
			className={ clsx( styles.pill, {
				[ styles[ 'pill-alt' ] ]: altVersion,
			} ) }
		>
			{ text }
		</span>
	);
};

export default Pill;
