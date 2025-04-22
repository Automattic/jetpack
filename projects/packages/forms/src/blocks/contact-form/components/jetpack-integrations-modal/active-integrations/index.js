import colorStudio from '@automattic/color-studio';
import { JetpackIcon } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import AkismetIcon from '../../../../../icons/akismet-icon';
import './style.scss';

const COLOR_JETPACK = colorStudio.colors[ 'Jetpack Green 40' ];

export default function ActiveIntegrations( { integrations, attributes, isLoading } ) {
	const getIconForIntegration = key => {
		switch ( key ) {
			case 'akismet':
				return <AkismetIcon width={ 32 } height={ 32 } />;
			case 'zero-bs-crm':
				return <JetpackIcon size={ 32 } color={ COLOR_JETPACK } />;
			default:
				return null;
		}
	};

	if ( isLoading ) {
		return (
			<div className="jetpack-forms-enabled-integrations">
				<Spinner />
			</div>
		);
	}

	const enabledIntegrations = integrations.filter( integration => {
		switch ( integration.id ) {
			case 'akismet':
				return integration.isConnected;
			case 'zero-bs-crm':
				return integration.isActive && integration.details?.hasExtension && attributes.jetpackCRM;
			default:
				return false;
		}
	} );

	if ( ! enabledIntegrations?.length ) {
		return null;
	}

	return (
		<div className="jetpack-forms-enabled-integrations">
			{ enabledIntegrations.map( integration => (
				<span key={ integration.id } className="jetpack-forms-integration-icon">
					{ getIconForIntegration( integration.id ) }
					<span className="jetpack-forms-integration-icon__status-indicator" />
				</span>
			) ) }
		</div>
	);
}
