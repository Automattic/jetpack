import clsx from 'clsx';
import React from 'react';
import styles from './style.module.scss';

type BadgeProps = {
	children?: React.ReactNode;
	className?: string;
	variant?: 'success' | 'warning' | 'danger';
	[ key: string ]: unknown;
};

/**
 * Badge component
 *
 * @param {object}      props           - The component properties.
 * @param {string}      props.variant   - The badge variant (i.e. 'success', 'warning', 'danger').
 * @param {JSX.Element} props.children  - Badge text or content.
 * @param {string}      props.className - Additional class name to pass to the Badge component.
 *
 * @return {React.ReactElement} The `Badge` component.
 */
const Badge: React.FC< BadgeProps > = ( { children, className, variant, ...props } ) => {
	const classes = clsx(
		styles.badge,
		{
			[ styles[ 'is-success' ] ]: variant === 'success',
			[ styles[ 'is-warning' ] ]: variant === 'warning',
			[ styles[ 'is-danger' ] ]: variant === 'danger',
		},
		className
	);
	return (
		<span className={ classes } { ...props }>
			{ children }
		</span>
	);
};

export default Badge;
