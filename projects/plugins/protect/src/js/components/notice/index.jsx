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
	type = 'success',
} ) => {
	const { clearNotice } = useNotices();

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
		<WPNotice.Root
			intent={ INTENTS[ type ] || 'info' }
			className={ clsx(
				styles.notice,
				styles[ `notice--${ type }` ],
				floating && styles[ 'notice--floating' ]
			) }
			// The legacy notice never announced, and none of the three call sites
			// sits in a live region. Announcing is a separate change.
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
