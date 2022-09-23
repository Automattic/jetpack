/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import { IndeterminateProgressBarProps } from './types';
import type React from 'react';

/**
 * Progress Bar component
 *
 * @param {IndeterminateProgressBarProps} props - Component props.
 * @returns {React.ReactNode} - IndeterminateProgressBar react component.
 */
const IndeterminateProgressBar: React.FC< IndeterminateProgressBarProps > = ( { className } ) => {
	return <div className={ classnames( className, styles.wrapper ) } />;
};

export default IndeterminateProgressBar;
