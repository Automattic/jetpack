import { SnackbarList } from '@wordpress/components';
import styles from './styles.module.scss';
import { useGlobalNotices } from './use-global-notices.js';

export type GlobalNoticesProps = {
	maxVisibleNotices?: number;
};

/**
 * Renders the global notices.
 *
 * @param {GlobalNoticesProps} props - Component props.
 *
 * @return {import('react').ReactNode} The rendered notices list.
 */
export function GlobalNotices( { maxVisibleNotices = 3 }: GlobalNoticesProps ) {
	const { getNotices, removeNotice } = useGlobalNotices();

	const snackbarNotices = getNotices()
		.filter( ( { type } ) => type === 'snackbar' )
		// Slices from the tail end of the list.
		.slice( -maxVisibleNotices );

	return (
		<SnackbarList
			notices={ snackbarNotices }
			className={ styles[ 'global-notices' ] }
			onRemove={ removeNotice }
		/>
	);
}
