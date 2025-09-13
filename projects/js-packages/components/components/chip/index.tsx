import clsx from 'clsx';
import styles from './style.module.scss';
import type { ReactElement, FC } from 'react';

type ChipProps = {
	text?: string;
	type?: 'new' | 'info';
};

/**
 * Chip component
 *
 * @param {object} props      - The component properties.
 * @param {string} props.type - The type new or info
 * @param {string} props.text - Chip text
 * @return {ReactElement} The `Chip` component.
 */
const Chip: FC< ChipProps > = ( { type = 'info', text } ) => {
	const classes = clsx( styles.chip, styles[ `is-${ type }` ] );
	return <span className={ classes }>{ text }</span>;
};

export default Chip;
