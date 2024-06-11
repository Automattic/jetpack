/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import { IndeterminateProgressBarProps } from './types';
import type React from 'react';

/**
 * Indeterminate Progress Bar component
 *
 * @param {IndeterminateProgressBarProps} props - Component props.
 * @returns {React.ReactNode} - IndeterminateProgressBar react component.
 */
const IndeterminateProgressBar: React.FC< IndeterminateProgressBarProps > = ( { className } ) => {
	return (
		<div
			className={ clsx( className, styles[ 'indeterminate-progress-bar' ] ) }
			aria-label={ __( 'Indeterminate Progress Bar', 'jetpack' ) }
		/>
	);
};

export default IndeterminateProgressBar;
