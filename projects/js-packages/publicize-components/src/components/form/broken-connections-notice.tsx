import { Button } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { _n } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { store } from '../../social-store';
import Notice from '../notice';
import styles from './styles.module.scss';
import { checkConnectionCode } from './utils';

export const BrokenConnectionsNotice: React.FC = () => {
	const { connections } = useSocialMediaConnections();

	const brokenConnections = connections.filter( connection => {
		return (
			connection.status === 'broken' ||
			// This is a legacy check for connections that are not healthy.
			// TODO remove this check when we are sure that all connections have
			// the status property (same schema for connections endpoints), e.g. on Simple/Atomic sites
			checkConnectionCode( connection, 'broken' )
		);
	} );

	const { connectionsAdminUrl } = usePublicizeConfig();

	const useAdminUiV1 = useSelect( select => select( store ).useAdminUiV1(), [] );
	const { openConnectionsModal } = useDispatch( store );

	const fixLink = useAdminUiV1 ? (
		<Button
			variant="link"
			onClick={ openConnectionsModal }
			className={ styles[ 'broken-connection-btn' ] }
		/>
	) : (
		<ExternalLink href={ connectionsAdminUrl } />
	);

	return (
		brokenConnections.length > 0 && (
			<Notice type={ 'error' }>
				{ createInterpolateElement(
					_n(
						'One of your social connections is broken. Reconnect them in the <fixLink>connections management</fixLink> section.',
						'Some of your social connections are broken. Reconnect them in the <fixLink>connections management</fixLink> section.',
						brokenConnections.length,
						'jetpack'
					),
					{
						fixLink,
					}
				) }
			</Notice>
		)
	);
};
