import { __ } from '@wordpress/i18n';
import { Icon, arrowLeft } from '@wordpress/icons';
import { Link } from 'react-router';
import styles from './styles.module.scss';
import type { MouseEvent, ReactNode } from 'react';

/**
 * Go Back Link component.
 *
 * Used as the page back-link for product interstitials, also rendered into
 * AdminPage's `breadcrumbs` slot to act as the page title.
 *
 * @param props         - Component props.
 * @param props.onClick - Optional click handler for the link.
 * @param props.reload  - Whether the link should trigger a reload when clicked.
 * @param props.to      - Optional explicit destination route. Defaults to `/`
 *                      (or `/?reload=true` when `reload` is set). When set,
 *                      takes precedence over `reload`.
 * @param props.label   - Optional label text. Defaults to "Go back".
 * @return The rendered component.
 */
function GoBackLink( {
	onClick,
	reload,
	to,
	label,
}: {
	onClick?: ( event: MouseEvent ) => void;
	reload?: boolean;
	to?: string;
	label?: ReactNode;
} ) {
	const destination = to ?? ( reload ? '/?reload=true' : '/' );

	return (
		<Link to={ destination } className={ styles.link } onClick={ onClick }>
			<Icon icon={ arrowLeft } className={ styles.icon } />
			{ label ?? __( 'Go back', 'jetpack-my-jetpack' ) }
		</Link>
	);
}

export default GoBackLink;
