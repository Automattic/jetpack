import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';
import { Notice as WPNotice } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useEffect } from 'react';
import useNotices from '../../hooks/use-notices';
import styles from './styles.module.scss';

const INTENTS = {
	success: 'success',
	error: 'error',
	info: 'info',
	warning: 'warning',
};

const Notice = ( {
	dismissable = false,
	duration = null,
	floating = false,
	message,
	noticeId = 0,
	spokenMessage,
	type = 'success',
} ) => {
	const { clearNotice } = useNotices();

	const onClose = useCallback( () => {
		clearNotice();
	}, [ clearNotice ] );

	const spoken = spokenMessage ?? ( 'string' === typeof message ? message : null );

	// Keyed on `noticeId`: effect deps compare by value, so an identical repeat would not re-fire.
	useEffect( () => {
		// Toast only: notices rendered inside a modal are not announced today.
		if ( floating && 'string' === typeof spoken ) {
			speak( spoken, 'error' === type ? 'assertive' : 'polite' );
		}
	}, [ noticeId, floating, spoken, type ] );

	/**
	 * Clears the notice automatically after {duration} milliseconds.
	 */
	useEffect( () => {
		let timeout;

		if ( duration ) {
			timeout = setTimeout( clearNotice, duration );
		}

		return () => clearTimeout( timeout );
	}, [ clearNotice, duration, noticeId ] );

	return (
		<WPNotice.Root
			intent={ INTENTS[ type ] || 'info' }
			className={ clsx(
				styles.notice,
				styles[ `notice--${ type }` ],
				floating && styles[ 'notice--floating' ]
			) }
			// Null, not omitted: the default is the children, which `Notice.Root` serializes
			// mid-render, corrupting hook order. Drop with the prop (WordPress/gutenberg#82737).
			spokenMessage={ null }
		>
			<WPNotice.Description>{ message }</WPNotice.Description>
			{ dismissable && (
				<WPNotice.CloseIcon
					label={ __( 'Dismiss notice.', 'jetpack-protect' ) }
					onClick={ onClose }
				/>
			) }
		</WPNotice.Root>
	);
};

export default Notice;
