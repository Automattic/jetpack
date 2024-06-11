import clsx from 'clsx';
import styles from './style.module.scss';

/**
 * Progress Bar component
 *
 * @param {object} props           - Component props
 * @param {string} props.className - Additional classnames
 * @param {number} props.total     - Total integer
 * @param {number} props.value     - Progress integer
 * @returns {object} ProgressBar React component.
 */
const ProgressBar = ( { className, total = 100, value } ) => {
	if ( value == null ) {
		return null;
	}

	// The percentage should not be allowed to be more than 100
	const progress = Math.min( Math.round( ( value / total ) * 100 ), 100 );

	const style = {
		width: `${ progress }%`,
	};

	return (
		<div className={ clsx( className, styles[ 'progress-bar' ] ) }>
			<div className={ styles[ 'progress-bar__wrapper' ] }>
				<div
					aria-valuemax={ total }
					aria-valuemin={ 0 }
					aria-valuenow={ Math.min( value, total ) }
					className={ styles[ 'progress-bar__bar' ] }
					role="progressbar"
					style={ style }
				/>
			</div>
			<p className={ styles[ 'progress-bar__percent' ] }>{ `${ progress }%` }</p>
		</div>
	);
};

export default ProgressBar;
