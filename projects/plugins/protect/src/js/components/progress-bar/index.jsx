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
 * @param {number} props.progress  - Progress integer
 * @returns {object}                    ProtectProgressBar react component.
 */
const ProtectProgressBar = ( { className, progress } ) => {
	if ( progress == null ) {
		return null;
	}

	const style = {
		width: `${ progress }%`,
	};

	return (
		<div className={ classnames( className, styles[ 'progress-wrapper' ] ) }>
			<div className={ styles.progress } style={ style }></div>
			<p className={ styles[ 'progress-percent' ] }>{ progress }%</p>
		</div>
	);
};

export default ProtectProgressBar;
