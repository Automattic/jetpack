import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, ExternalLink, Tooltip } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { Icon, linkOff } from '@wordpress/icons';
import { useCallback } from 'react';
import useSharePost from '../../hooks/use-share-post';
import { store as socialStore } from '../../social-store';
import styles from './styles.module.scss';

type ShareStatusActionProps = {
	status: string;
	service: string;
	shareLink: string;
	connectionId: number | string;
};

/**
 *
 * Share status action component.
 *
 * @param {ShareStatusActionProps} props - component props
 * @return {import('react').ReactNode} - React element
 */
export function ShareStatusAction( {
	connectionId,
	status,
	shareLink,
	service,
}: ShareStatusActionProps ) {
	const { recordEvent } = useAnalytics();
	// @ts-expect-error -- `@wordpress/editor` is badly typed, causes issue in CI
	const postId = useSelect( select => select( editorStore ).getCurrentPostId(), [] );
	const connections = useSelect( select => select( socialStore ).getConnections(), [] );

	const { doPublicize } = useSharePost( postId );

	const onRetry = useCallback( () => {
		recordEvent( 'jetpack_social_share_status_retry', { service, location: 'modal' } );

		const skippedConnections = connections.filter(
			connection => connection.connection_id !== connectionId.toString()
		);

		// This means that the connection that failed is not in the list of connections anymore.
		if ( skippedConnections.length === connections.length ) {
			return;
		}

		doPublicize( skippedConnections.map( connection => connection.connection_id ) );
	}, [ connectionId, connections, doPublicize, recordEvent, service ] );

	const recordViewEvent = useCallback( () => {
		recordEvent( 'jetpack_social_share_status_view', { service, location: 'modal' } );
	}, [ recordEvent, service ] );

	const renderActions = () => {
		if ( 'success' === status ) {
			return (
				<ExternalLink
					className={ styles[ 'profile-link' ] }
					href={ shareLink }
					onClick={ recordViewEvent }
				>
					{ __( 'View', 'jetpack' ) }
				</ExternalLink>
			);
		}

		if (
			! connections.find( connection => connection.connection_id === connectionId.toString() )
		) {
			return (
				<Tooltip text={ __( 'This connection has been removed.', 'jetpack' ) }>
					<Icon icon={ linkOff } size={ 20 } className={ styles[ 'disconnected-icon' ] } />
				</Tooltip>
			);
		}

		return (
			<Button variant="link" onClick={ onRetry }>
				{ __( 'Retry', 'jetpack' ) }
			</Button>
		);
	};

	return <div>{ renderActions() }</div>;
}
