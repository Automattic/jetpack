import { Icon, Spinner, Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { plugins } from '@wordpress/icons';
import { isValidSalesforceOrgId } from '../helpers/salesforce.tsx';
import './style.scss';

export default function ActiveIntegrations( { integrations, attributes, isLoading } ) {
	const activeIntegrations = integrations.reduce( ( acc, integration ) => {
		switch ( integration.id ) {
			case 'akismet':
				if ( integration.isConnected ) {
					acc.push( integration );
				}
				break;
			case 'zero-bs-crm':
				if ( integration.isActive && integration.details?.hasExtension && attributes.jetpackCRM ) {
					acc.push( integration );
				}
				break;
			case 'mailpoet':
				if (
					integration.isActive &&
					integration.isConnected &&
					attributes.mailpoet?.enabledForForm
				) {
					acc.push( integration );
				}
				break;
			case 'hostinger-reach':
				if (
					integration.isActive &&
					integration.isConnected &&
					attributes.hostingerReach?.enabledForForm
				) {
					acc.push( integration );
				}
				break;
			case 'salesforce':
				if (
					attributes.salesforceData?.sendToSalesforce &&
					attributes.salesforceData?.organizationId &&
					isValidSalesforceOrgId( attributes.salesforceData.organizationId )
				) {
					acc.push( integration );
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
		return (
			<p>
				<em>{ __( 'Form does not have integrations set up.', 'jetpack-forms' ) }</em>
			</p>
		);
	}

	return (
		<div className="jetpack-forms-active-integrations">
			{ activeIntegrations.map( integration => (
				<Tooltip
					key={ integration.id }
					text={ integration.activeTooltip || integration.title || '' }
				>
					<span className="jetpack-forms-active-integrations__item">
						{ integration.iconUrl ? (
							<img
								src={ integration.iconUrl }
								alt={ integration.title || integration.id }
								width={ 30 }
								height={ 30 }
								className="jetpack-forms-active-integrations__icon"
							/>
						) : (
							<Icon
								icon={ plugins }
								size={ 30 }
								className="jetpack-forms-active-integrations__icon"
							/>
						) }
						<span className="jetpack-forms-active-integrations__status" />
					</span>
				</Tooltip>
			) ) }
		</div>
	);
}
