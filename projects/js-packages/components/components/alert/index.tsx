/**
 * External dependencies
 */
import React from 'react';
import { Icon, warning, info, check } from '@wordpress/icons';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';

/**
 * Contants
 */
export const LEVEL_ERROR = 'error';
export const LEVEL_WARNING = 'warning';
export const LEVEL_INFO = 'info';
export const LEVEL_SUCCESS = 'success';

export const ALERT_LEVELS = [ LEVEL_ERROR, LEVEL_WARNING, LEVEL_INFO, LEVEL_SUCCESS ];

type AlertProps = {
	/** The severity of the alert. */
	level: typeof LEVEL_ERROR | typeof LEVEL_WARNING | typeof LEVEL_INFO | typeof LEVEL_SUCCESS;

	/** Children to be rendered inside the alert. */
	children: React.ReactElement | string;

	showIcon?: boolean;
};

const getIconByLevel = ( level: AlertProps[ 'level' ] ) => {
	switch ( level ) {
		case LEVEL_ERROR:
			return warning;
		case LEVEL_WARNING:
			return warning;
		case LEVEL_INFO:
			return info;
		case LEVEL_SUCCESS:
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
 * @returns {React.Component}                The `Alert` component.
 */
function Alert( { level, children, showIcon }: AlertProps ): React.ReactElement {
	const classes = classNames( styles.container, styles[ `is-${ level }` ] );

	return (
		<div className={ classes }>
			{ showIcon && <Icon icon={ getIconByLevel( level ) } className={ styles.icon } /> }
			{ children }
		</div>
	);
}

Alert.defaultProps = {
	level: LEVEL_WARNING,
	showIcon: true,
};

export default Alert;
