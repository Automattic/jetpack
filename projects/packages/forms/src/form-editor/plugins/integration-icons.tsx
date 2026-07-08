/**
 * External dependencies
 */
import { Icon, Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { plugins } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { isValidSalesforceOrgId } from '../../blocks/contact-form/components/jetpack-integrations-modal/helpers/salesforce.tsx';
import type { Integration } from '../../types/index.ts';

type FormAttributes = {
	jetpackCRM?: boolean;
	salesforceData?: { sendToSalesforce?: boolean; organizationId?: string };
	mailpoet?: { enabledForForm?: boolean; listId?: string | null };
	hostingerReach?: { enabledForForm?: boolean; groupName?: string };
	googleSheets?: boolean;
};

/**
 * Filters integrations to only those that are active for this form.
 *
 * @param {Integration[]}  integrations - All available integrations from the store.
 * @param {FormAttributes} attributes   - The form block attributes.
 * @return {Integration[]} Active integrations.
 */
const getActiveIntegrations = (
	integrations: Integration[],
	attributes: FormAttributes
): Integration[] => {
	return integrations.filter( integration => {
		switch ( integration.id ) {
			case 'akismet':
				return integration.isConnected;
			case 'zero-bs-crm':
				return integration.isActive && integration.details?.hasExtension && attributes.jetpackCRM;
			case 'mailpoet':
				return (
					integration.isActive && integration.isConnected && attributes.mailpoet?.enabledForForm
				);
			case 'hostinger-reach':
				return (
					integration.isActive &&
					integration.isConnected &&
					attributes.hostingerReach?.enabledForForm
				);
			case 'salesforce':
				return (
					attributes.salesforceData?.sendToSalesforce &&
					attributes.salesforceData?.organizationId &&
					isValidSalesforceOrgId( attributes.salesforceData.organizationId )
				);
			case 'google-drive':
				return attributes.googleSheets;
			default:
				return false;
		}
	} );
};

/**
 * Displays icons for all active integrations on a form.
 *
 * @param {object}         props              - Component props.
 * @param {FormAttributes} props.attributes   - The form block attributes.
 * @param {Integration[]}  props.integrations - All available integrations from the store.
 * @return {JSX.Element} The integration icons element.
 */
const IntegrationIcons = ( {
	attributes,
	integrations,
}: {
	attributes: FormAttributes;
	integrations: Integration[];
} ) => {
	const activeIntegrations = getActiveIntegrations( integrations, attributes );

	if ( ! activeIntegrations.length ) {
		return <>{ __( 'None', 'jetpack-forms' ) }</>;
	}

	return (
		<span className="jetpack-form-pre-publish__integration-icons">
			{ activeIntegrations.map( integration => (
				<Tooltip key={ integration.id } text={ integration.title || '' }>
					<span>
						{ integration.iconUrl ? (
							<img
								src={ integration.iconUrl }
								alt={ integration.title || integration.id }
								width={ 20 }
								height={ 20 }
							/>
						) : (
							<Icon icon={ plugins } size={ 20 } />
						) }
					</span>
				</Tooltip>
			) ) }
		</span>
	);
};

export default IntegrationIcons;
