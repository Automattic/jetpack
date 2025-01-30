import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { usePublicizeConfig } from '../../..';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import Notice from '../notice';
import { useService } from '../services/use-service';

export const UnsupportedConnectionsNotice: React.FC = () => {
	const { connections } = useSocialMediaConnections();

	const { connectionsPageUrl } = usePublicizeConfig();

	const getServices = useService();

	const unsupportedConnections = connections.filter(
		connection =>
			// If getServices returns falsy, it means the service is unsupported.
			! getServices( connection.service_name )
	);

	return (
		unsupportedConnections.length > 0 && (
			<Notice type={ 'error' }>
				{ createInterpolateElement(
					__(
						'Twitter is not supported anymore. <moreInfo>Learn more here</moreInfo>.',
						'jetpack-publicize-components'
					),
					{
						moreInfo: <ExternalLink href={ connectionsPageUrl } />,
					}
				) }
			</Notice>
		)
	);
};
