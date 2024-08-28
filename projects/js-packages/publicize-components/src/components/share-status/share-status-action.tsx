import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';

/**
 *
 * Share status action component.
 *
 * @param {object}  props           - component props
 * @param {boolean} props.status    - status of the share
 * @param {string}  props.shareLink - link to the share
 * @return {import('react').ReactNode} - React element
 */
export function ShareStatusAction( { status, shareLink } ) {
	return (
		<div className={ styles[ 'share-status-action-wrapper' ] }>
			{ 'success' !== status ? (
				<span>Retry</span>
			) : (
				<ExternalLink className={ styles[ 'profile-link' ] } href={ shareLink }>
					{ __( 'View', 'jetpack' ) }
				</ExternalLink>
			) }
		</div>
	);
}
