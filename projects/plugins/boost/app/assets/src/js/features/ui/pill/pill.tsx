import clsx from 'clsx';
import styles from './pill.module.scss';

type PillVariant = 'default' | 'red' | 'gray';

const Pill = ( { text, variant = 'default' }: { text: string; variant?: PillVariant } ) => {
	return (
		<span
			className={ clsx( styles.pill, {
				[ styles[ `pill-${ variant }` ] ]: variant,
			} ) }
		>
			{ text }
		</span>
	);
};

export default Pill;
