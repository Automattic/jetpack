/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import { ProgressBarProps } from './types';
import type React from 'react';

/**
 * Progress Bar component
 *
 * @param {ProgressBarProps} props - Component props.
 * @returns {React.ReactNode} - ProgressBar react component.
 */
const ProgressBar: React.FC< ProgressBarProps > = ( {
	className,
	progressClassName,
	progress,
	size = 'normal',
} ) => {
	if ( progress == null ) {
		return null;
	}

	const normalizedProgress = Math.max( Math.min( progress, 1 ), 0 );

	const style = {
		width: `${ normalizedProgress * 100 }%`,
	};

	return (
		<div
			className={ classnames( className, styles.wrapper, { [ styles.small ]: size === 'small' } ) }
		>
			<div className={ classnames( progressClassName, styles.progress ) } style={ style }></div>
		</div>
	);
};

export default ProgressBar;
