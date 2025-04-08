/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import { IndeterminateProgressBarProps } from './types.js';
import type React from 'react';

/**
 * Indeterminate Progress Bar component
 *
 * @param {IndeterminateProgressBarProps} props - Component props.
 * @return {React.ReactNode} - IndeterminateProgressBar react component.
 */
const IndeterminateProgressBar: React.FC< IndeterminateProgressBarProps > = ( { className } ) => {
	return (
		<div
			className={ clsx( className, styles[ 'indeterminate-progress-bar' ] ) }
			aria-label={ __( 'Indeterminate Progress Bar', 'jetpack-components' ) }
		/>
	);
};

export default IndeterminateProgressBar;
