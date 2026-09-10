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
	id = 0,
	message,
	spokenMessage,
	type = 'success',
} ) => {
	const { clearNotice } = useNotices();

	const onClose = useCallback( () => {
		clearNotice();
	}, [ clearNotice ] );

	const spoken = spokenMessage ?? ( 'string' === typeof message ? message : null );

	// Announced here, keyed on the notice, rather than by `Notice.Root`: it diffs the
	// value, so an identical repeat would never announce twice. `speak()` handles the
	// repeat itself, and a JSX message never reaches its serializer this way.
	useEffect( () => {
		if ( floating && 'string' === typeof spoken ) {
			speak( spoken, 'error' === type ? 'assertive' : 'polite' );
		}
	}, [ id, floating, spoken, type ] );

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
		<WPNotice.Root
			intent={ INTENTS[ type ] || 'info' }
			className={ clsx(
				styles.notice,
				styles[ `notice--${ type }` ],
				floating && styles[ 'notice--floating' ]
			) }
			// Always null, never undefined: the default is the children, which
			// `Notice.Root` renders mid-render, corrupting hook order on a JSX message.
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
