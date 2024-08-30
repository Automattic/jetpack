import { Button, ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import useSharePost from '../../hooks/use-share-post';
import { store as socialStore } from '../../social-store';
import styles from './styles.module.scss';

/**
 *
 * Share status action component.
 *
 * @param {object}  props              - component props
 * @param {boolean} props.status       - status of the share
 * @param {string}  props.shareLink    - link to the share
 * @param {number}  props.connectionId - connection id
 * @return {import('react').ReactNode} - React element
 */
export function ShareStatusAction( { connectionId, status, shareLink } ) {
	const postId = useSelect( select => select( editorStore ).getCurrentPostId(), [] );
	const connections = useSelect( select => select( socialStore ).getConnections(), [] );

	const { doPublicize } = useSharePost( postId );

	const onRetry = useCallback( () => {
		const skippedConnections = connections.filter(
			connection => connection.connection_id !== connectionId.toString()
		);

		// This means that the connection that failed is not in the list of connections anymore.
		if ( skippedConnections.length === connections.length ) {
			return;
		}

		doPublicize( skippedConnections.map( connection => connection.id ) );
	}, [ connectionId, connections, doPublicize ] );

	return (
		<div className={ styles[ 'share-status-action-wrapper' ] }>
			{ 'success' !== status ? (
				<Button variant="link" onClick={ onRetry }>
					{ __( 'Retry', 'jetpack' ) }
				</Button>
			) : (
				<ExternalLink className={ styles[ 'profile-link' ] } href={ shareLink }>
					{ __( 'View', 'jetpack' ) }
				</ExternalLink>
			) }
		</div>
	);
}
