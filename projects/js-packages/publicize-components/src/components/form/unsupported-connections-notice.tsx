import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { usePublicizeConfig } from '../../..';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import Notice from '../notice';
import { checkConnectionCode } from './utils';

export const UnsupportedConnectionsNotice: React.FC = () => {
	const { connections } = useSocialMediaConnections();

	const { connectionsAdminUrl } = usePublicizeConfig();

	const unsupportedConnections = connections.filter( connection =>
		checkConnectionCode( connection, 'unsupported' )
	);

	return (
		unsupportedConnections.length > 0 && (
			<Notice type={ 'error' }>
				{ createInterpolateElement(
					__(
						'Twitter is not supported anymore. <moreInfo>Learn more here</moreInfo>.',
						'jetpack'
					),
					{
						moreInfo: <ExternalLink href={ connectionsAdminUrl } />,
					}
				) }
			</Notice>
		)
	);
};
