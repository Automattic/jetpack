import colorStudio from '@automattic/color-studio';
import { JetpackIcon } from '@automattic/jetpack-components';
import { Spinner, Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import AkismetIcon from '../../../../../icons/akismet';
import SalesforceIcon from '../../../../../icons/salesforce';
import { isValidSalesforceOrgId } from '../salesforce-card';
import './style.scss';

const COLOR_JETPACK = colorStudio.colors[ 'Jetpack Green 40' ];

export default function ActiveIntegrations( { integrations, attributes, isLoading } ) {
	const activeIntegrations = integrations.reduce( ( acc, integration ) => {
		switch ( integration.id ) {
			case 'akismet':
				if ( integration.isConnected ) {
					acc.push( {
						...integration,
						icon: <AkismetIcon width={ 30 } height={ 30 } className="icon-round" />,
						tooltip: __( 'Akismet is connected for this form', 'jetpack-forms' ),
					} );
				}
				break;
			case 'zero-bs-crm':
				if ( integration.isActive && integration.details?.hasExtension && attributes.jetpackCRM ) {
					acc.push( {
						...integration,
						icon: <JetpackIcon size={ 30 } color={ COLOR_JETPACK } />,
						tooltip: __( 'Jetpack CRM is connected for this form', 'jetpack-forms' ),
					} );
				}
				break;
			case 'salesforce':
				if (
					attributes.salesforceData?.sendToSalesforce &&
					attributes.salesforceData?.organizationId &&
					isValidSalesforceOrgId( attributes.salesforceData.organizationId )
				) {
					acc.push( {
						...integration,
						icon: <SalesforceIcon width={ 30 } height={ 30 } />,
						tooltip: __( 'Salesforce is connected for this form', 'jetpack-forms' ),
					} );
				}
				break;
		}
		return acc;
	}, [] );

	if ( isLoading ) {
		return (
			<div className="jetpack-forms-active-integrations">
				<Spinner />
			</div>
		);
	}

	if ( ! activeIntegrations?.length ) {
		return null;
	}

	return (
		<div className="jetpack-forms-active-integrations">
			{ activeIntegrations.map( integration => (
				<Tooltip key={ integration.id } text={ integration.tooltip }>
					<span className="jetpack-forms-active-integrations__item">
						{ integration.icon }
						<span className="jetpack-forms-active-integrations__status" />
					</span>
				</Tooltip>
			) ) }
		</div>
	);
}
