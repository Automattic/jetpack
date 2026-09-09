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
	spokenMessage,
	type = 'success',
} ) => {
	const { clearNotice } = useNotices();

	const onClose = useCallback( () => {
		clearNotice();
	}, [ clearNotice ] );

	const spoken = spokenMessage ?? ( 'string' === typeof message ? message : null );

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
			// Only the toast announces: the modal notices are read when their dialog opens.
			// The value must be null, never undefined — `Notice.Root` defaults it to the
			// children and renders those mid-render, corrupting hook order on a JSX message.
			spokenMessage={ floating ? spoken : null }
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
