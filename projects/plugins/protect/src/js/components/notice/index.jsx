import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { check, close, info, warning, Icon } from '@wordpress/icons';
import { useCallback, useEffect } from 'react';
import { STORE_ID } from '../../state/store';
import styles from './styles.module.scss';

const Notice = ( {
	dismissable = false,
	duration = null,
	floating = false,
	message,
	type = 'success',
} ) => {
	const { clearNotice } = useDispatch( STORE_ID );

	let icon;
	switch ( type ) {
		case 'success':
			icon = check;
			break;
		case 'error':
			icon = warning;
			break;
		case 'info':
		default:
			icon = info;
	}

	const onClose = useCallback( () => {
		clearNotice();
	}, [ clearNotice ] );

	/**
	 * Clears the notice automatically after {duration} milliseconds.
	 */
	useEffect( () => {
		let timeout;

		if ( duration ) {
			timeout = setTimeout( clearNotice, duration );
		}

		return () => clearTimeout( timeout );
	}, [ clearNotice, duration, message ] );

	return (
		<div
			className={ `${ styles.notice } ${ styles[ `notice--${ type }` ] } ${
				floating ? styles[ 'notice--floating' ] : ''
			}` }
		>
			<div className={ styles.notice__icon }>
				<Icon icon={ icon } />
			</div>
			<div className={ styles.notice__message }>{ message }</div>
			{ dismissable && (
				<button
					className={ styles.notice__close }
					aria-label={ __( 'Dismiss notice.', 'jetpack-protect' ) }
					onClick={ onClose }
				>
					<Icon icon={ close } />
				</button>
			) }
		</div>
	);
};

export default Notice;
