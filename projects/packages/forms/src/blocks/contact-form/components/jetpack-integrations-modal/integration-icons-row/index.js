import colorStudio from '@automattic/color-studio';
import { JetpackIcon } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import AkismetIcon from '../../../../../icons/akismet-icon';
import './style.scss';

const COLOR_JETPACK = colorStudio.colors[ 'Jetpack Green 40' ];

export default function IntegrationIconsRow( { enabledIntegrations, isLoading } ) {
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

	if ( ! enabledIntegrations?.length ) {
		return null;
	}

	return (
		<div className="jetpack-forms-enabled-integrations">
			{ enabledIntegrations.map( ( [ key ] ) => (
				<span key={ key } className="jetpack-forms-integration-icon">
					{ getIconForIntegration( key ) }
					<span className="jetpack-forms-integration-icon__status-indicator" />
				</span>
			) ) }
		</div>
	);
}
