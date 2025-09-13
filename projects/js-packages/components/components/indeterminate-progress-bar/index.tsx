/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import { IndeterminateProgressBarProps } from './types.ts';
import type { FC, ReactNode } from 'react';

/**
 * Indeterminate Progress Bar component
 *
 * @param {IndeterminateProgressBarProps} props - Component props.
 * @return {ReactNode} - IndeterminateProgressBar react component.
 */
const IndeterminateProgressBar: FC< IndeterminateProgressBarProps > = ( { className } ) => {
	return (
		<div
			className={ clsx( className, styles[ 'indeterminate-progress-bar' ] ) }
			aria-label={ __( 'Indeterminate Progress Bar', 'jetpack-components' ) }
		/>
	);
};

export default IndeterminateProgressBar;
