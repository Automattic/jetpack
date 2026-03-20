import { __ } from '@wordpress/i18n';
import { Icon, arrowLeft } from '@wordpress/icons';
import { Link } from 'react-router';
import styles from './styles.module.scss';
import type { MouseEvent } from 'react';

/**
 * Go Back Link component.
 *
 * @param {object}   props         - Component props.
 * @param {Function} props.onClick - Optional click handler for the link.
 * @param {boolean}  props.reload  - Whether the link should trigger a reload when clicked.
 * @return The rendered component.
 */
function GoBackLink( {
	onClick,
	reload,
}: {
	onClick?: ( event: MouseEvent ) => void;
	reload: boolean;
} ) {
	const to = reload ? '/?reload=true' : '/';

	return (
		<Link to={ to } className={ styles.link } onClick={ onClick }>
			<Icon icon={ arrowLeft } className={ styles.icon } />
			{ __( 'Go back', 'jetpack-my-jetpack' ) }
		</Link>
	);
}

export default GoBackLink;
