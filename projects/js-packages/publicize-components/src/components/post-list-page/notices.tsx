import { SnackbarList } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import styles from './styles.module.scss';

// Last three notices. Slices from the tail end of the list.
const MAX_VISIBLE_NOTICES = -3;

/**
 * Renders the notice snackbars component.
 *
 * @return The rendered component.
 */
export default function Notices() {
	const notices = useSelect( select => {
		return select( noticesStore )
			.getNotices()
			.filter( ( { type } ) => type === 'snackbar' )
			.slice( MAX_VISIBLE_NOTICES );
	}, [] );

	const { removeNotice } = useDispatch( noticesStore );

	return (
		<SnackbarList notices={ notices } className={ styles.notices } onRemove={ removeNotice } />
	);
}
