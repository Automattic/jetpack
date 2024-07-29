import { Button } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement, Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { store } from '../../social-store';
import { Connection } from '../../social-store/types';
import Notice from '../notice';
import { SupportedService, useSupportedServices } from '../services/use-supported-services';
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

	const supportedServices = useSupportedServices();

	if ( ! brokenConnections.length ) {
		return null;
	}

	const servicesMap = supportedServices.reduce< Record< string, SupportedService > >(
		( acc, service ) => {
			acc[ service.ID ] = service;
			return acc;
		},
		{}
	);

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
				{ __( 'Your following connections need to be reconnected:', 'jetpack' ) }
				<ul>
					{ Object.entries( brokenConnectionsList ).map( ( [ service_name, connectionsList ] ) => {
						const serviceLabel =
							// For Jetpack sites, we should have the service in the map
							// But for WPCOM sites, we might not have the service in the map yet
							servicesMap[ service_name ]?.label ||
							// So we capitalize the service name
							service_name[ 0 ].toUpperCase() + service_name.substring( 1 );

						return (
							<li key={ service_name }>
								<div className={ styles[ 'broken-connection-service' ] }>
									<span>
										{ serviceLabel }
										{ _x( ':', 'Colon to display before the list of connections', 'jetpack' ) }
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
													_x( ',', 'Comma to separate list of social media accounts', 'jetpack' ) +
														' ' }
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
