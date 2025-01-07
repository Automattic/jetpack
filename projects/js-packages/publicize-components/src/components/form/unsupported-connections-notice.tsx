import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { usePublicizeConfig } from '../../..';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { checkConnectionCode } from '../../utils/connections';
import Notice from '../notice';

export const UnsupportedConnectionsNotice: React.FC = () => {
	const { connections } = useSocialMediaConnections();

	const { connectionsPageUrl } = usePublicizeConfig();

	const unsupportedConnections = connections.filter( connection =>
		checkConnectionCode( connection, 'unsupported' )
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
