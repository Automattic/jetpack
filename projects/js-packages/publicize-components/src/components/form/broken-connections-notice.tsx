import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { _n } from '@wordpress/i18n';
import { usePublicizeConfig } from '../../..';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import Notice from '../notice';
import { checkConnectionCode } from './utils';

export const BrokenConnectionsNotice: React.FC = () => {
	const { connections } = useSocialMediaConnections();

	const brokenConnections = connections.filter( connection =>
		checkConnectionCode( connection, 'broken' )
	);

	const { connectionsAdminUrl } = usePublicizeConfig();
	return (
		brokenConnections.length > 0 && (
			<Notice type={ 'error' }>
				{ createInterpolateElement(
					_n(
						'One of your social connections is broken. Reconnect them on the <fixLink>connection management</fixLink> page.',
						'Some of your social connections are broken. Reconnect them on the <fixLink>connection management</fixLink> page.',
						brokenConnections.length,
						'jetpack'
					),
					{
						fixLink: <ExternalLink href={ connectionsAdminUrl } />,
					}
				) }
			</Notice>
		)
	);
};
