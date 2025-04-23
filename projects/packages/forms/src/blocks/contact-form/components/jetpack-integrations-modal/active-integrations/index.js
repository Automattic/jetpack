import colorStudio from '@automattic/color-studio';
import { JetpackIcon } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import AkismetIcon from '../../../../../icons/akismet-icon';
import './style.scss';

const COLOR_JETPACK = colorStudio.colors[ 'Jetpack Green 40' ];

export default function ActiveIntegrations( { integrations, attributes, isLoading } ) {
	const activeIntegrations = integrations.reduce( ( acc, integration ) => {
		switch ( integration.id ) {
			case 'akismet':
				if ( integration.isConnected ) {
					acc.push( { ...integration, icon: <AkismetIcon width={ 30 } height={ 30 } /> } );
				}
				break;
			case 'zero-bs-crm':
				if ( integration.isActive && integration.details?.hasExtension && attributes.jetpackCRM ) {
					acc.push( { ...integration, icon: <JetpackIcon size={ 30 } color={ COLOR_JETPACK } /> } );
				}
				break;
		}
		return acc;
	}, [] );

	if ( isLoading ) {
		return (
			<div className="active-integrations">
				<Spinner />
			</div>
		);
	}

	if ( ! activeIntegrations?.length ) {
		return null;
	}

	return (
		<div className="active-integrations">
			{ activeIntegrations.map( integration => (
				<span key={ integration.id } className="active-integrations__item">
					{ integration.icon }
					<span className="active-integrations__status" />
				</span>
			) ) }
		</div>
	);
}
