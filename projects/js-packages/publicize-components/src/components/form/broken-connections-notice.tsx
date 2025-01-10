import { Button } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { createInterpolateElement, Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { store } from '../../social-store';
import { Connection } from '../../social-store/types';
import { checkConnectionCode } from '../../utils/connections';
import { getSocialScriptData } from '../../utils/script-data';
import Notice from '../notice';
import { useServiceLabel } from '../services/use-service-label';
import styles from './styles.module.scss';

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

	const { connectionsPageUrl } = usePublicizeConfig();

	const { useAdminUiV1 } = getSocialScriptData().feature_flags;

	const { openConnectionsModal } = useDispatch( store );

	const fixLink = useAdminUiV1 ? (
		<Button
			variant="link"
			onClick={ openConnectionsModal }
			className={ styles[ 'broken-connection-btn' ] }
		/>
	) : (
		<ExternalLink href={ connectionsPageUrl } />
	);

	const getServiceLabel = useServiceLabel();

	if ( ! brokenConnections.length ) {
		return null;
	}

	// Group broken connections by service
	// Since Object.groupBy is not supported widely yet, we use a manual grouping
	const brokenConnectionsList = brokenConnections.reduce< Record< string, Array< Connection > > >(
		( acc, connection ) => {
			if ( ! acc[ connection.service_name ] ) {
				acc[ connection.service_name ] = [];
			}
			acc[ connection.service_name ].push( connection );
			return acc;
		},
		{}
	);

	return (
		brokenConnections.length > 0 && (
			<Notice type={ 'error' }>
				{ __(
					'Your following connections need to be reconnected:',
					'jetpack-publicize-components'
				) }
				<ul>
					{ Object.entries( brokenConnectionsList ).map( ( [ service_name, connectionsList ] ) => {
						const serviceLabel = getServiceLabel( service_name );

						return (
							<li key={ service_name }>
								<div className={ styles[ 'broken-connection-service' ] }>
									<span>
										{ serviceLabel }
										{ _x(
											':',
											'Colon to display before the list of connections',
											'jetpack-publicize-components'
										) }
										&nbsp;
									</span>
									{
										// Since Intl.ListFormat is not allowed in Jetpack yet,
										// we join the connections with a comma and space
										connectionsList.map( ( { display_name, external_display, id }, i ) => (
											<Fragment key={ id }>
												<span className={ styles[ 'broken-connection' ] }>
													{ display_name || external_display }
												</span>
												{ i < connectionsList.length - 1 &&
													_x(
														',',
														'Comma to separate list of social media accounts',
														'jetpack-publicize-components'
													) + ' ' }
											</Fragment>
										) )
									}
								</div>
							</li>
						);
					} ) }
				</ul>
				{ createInterpolateElement(
					_x(
						'Please reconnect them in the <fixLink>connections management</fixLink> section.',
						'"them" refers to the broken connections.',
						'jetpack-publicize-components'
					),
					{
						fixLink,
					}
				) }
			</Notice>
		)
	);
};
