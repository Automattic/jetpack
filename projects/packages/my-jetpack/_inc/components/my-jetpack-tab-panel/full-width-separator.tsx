import { clsx } from 'clsx';
import styles from './styles.module.scss';

/**
 * Full Width Separator component that goes beyond the parent container.
 *
 * @param {React.HTMLAttributes< HTMLDivElement >} props - The component props.
 * @return The rendered component.
 */
export function FullWidthSeparator( props: React.HTMLAttributes< HTMLDivElement > ) {
	return (
		<div { ...props } className={ clsx( styles[ 'full-width-separator' ], props.className ) }></div>
	);
}
