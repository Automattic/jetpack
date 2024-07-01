import { Icon, warning, info, check } from '@wordpress/icons';
import clsx from 'clsx';
import React from 'react';
import styles from './style.module.scss';

type AlertProps = {
	/** The severity of the alert. */
	level: 'error' | 'warning' | 'info' | 'success';

	/** Show/Hide icon */
	showIcon?: boolean;

	/** Children to be rendered inside the alert. */
	children: React.ReactNode;
};

const getIconByLevel = ( level: AlertProps[ 'level' ] ) => {
	switch ( level ) {
		case 'error':
			return warning;
		case 'warning':
			return warning;
		case 'info':
			return info;
		case 'success':
			return check;
		default:
			return warning;
	}
};

/**
 * Alert component
 *
 * @param {object} props                   - The component properties.
 * @param {string} props.level             - The alert level: error, warning, info, success.
 * @param {boolean} props.showIcon         - Whether to show the alert icon.
 * @param {React.Component} props.children - The alert content.
 * @returns {React.ReactElement}             The `Alert` component.
 */
const Alert: React.FC< AlertProps > = ( { level = 'warning', children, showIcon = true } ) => {
	const classes = clsx( styles.container, styles[ `is-${ level }` ] );

	return (
		<div className={ classes }>
			{ showIcon && (
				<div className={ styles[ 'icon-wrapper' ] }>
					<Icon icon={ getIconByLevel( level ) } className={ styles.icon } />
				</div>
			) }
			<div>{ children }</div>
		</div>
	);
};

export default Alert;
