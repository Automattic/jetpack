/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import React from 'react';
import styles from './style.module.scss';

/**
 * Progress Bar component
 *
 * @param {object} props           - Component props
 * @param {string} props.className - Additional classnames
 * @param {number} props.total     - Total integer
 * @param {number} props.value     - Progress integer
 * @returns {object}                    ProtectProgressBar react component.
 */
const ProtectProgressBar = ( { className, total = 100, value } ) => {
	if ( value == null ) {
		return null;
	}

	// The percentage should not be allowed to be more than 100
	const progress = Math.min( ( value / total ) * 100, 100 );

	const style = {
		width: `${ progress }%`,
	};

	return (
		<div className={ classnames( className, styles[ 'progress-wrapper' ] ) }>
			<div
				aria-valuemax={ total }
				aria-valuemin={ 0 }
				aria-valuenow={ Math.min( value, total ) }
				className={ styles.progress }
				role="progressbar"
				style={ style }
			></div>
			<p className={ styles[ 'progress-percent' ] }>{ `${ progress }%` }</p>
		</div>
	);
};

export default ProtectProgressBar;
