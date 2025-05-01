import { TextControl, BaseControl, ExternalLink } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import SalesforceIcon from '../../../../icons/salesforce';
import HelpMessage from '../help-message';
import IntegrationCard from './integration-card';

export function isValidSalesforceOrgId( id ) {
	return typeof id === 'string' && /^[a-zA-Z0-9]{15,18}$/.test( id.trim() );
}

const SalesforceCard = ( {
	isExpanded,
	onToggle,
	data = {},
	refreshStatus,
	salesforceData = {},
	setAttributes,
} ) => {
	const [ organizationIdError, setOrganizationIdError ] = useState( false );

	const onHeaderToggleChange = value => {
		setAttributes( {
			salesforceData: {
				...salesforceData,
				sendToSalesforce: value,
			},
		} );
	};

	const setOrganizationId = value => {
		setOrganizationIdError( false );
		setAttributes( {
			salesforceData: {
				...salesforceData,
				organizationId: value.trim(),
			},
		} );
	};

	const onBlurOrgIdField = e => {
		setOrganizationIdError( ! isValidSalesforceOrgId( e.target.value ) );
	};

	const cardData = {
		...data,
		title: __( 'Salesforce', 'jetpack-forms' ),
		icon: <SalesforceIcon width={ 32 } height={ 22 } />,
		showHeaderToggle: true,
		headerToggleValue: salesforceData?.sendToSalesforce || false,
		isHeaderToggleEnabled: true,
		onHeaderToggleChange,
		isConnected: isValidSalesforceOrgId( salesforceData.organizationId ),
		isLoading: typeof data.isInstalled === 'undefined',
		refreshStatus,
	};

	return (
		<IntegrationCard
			title={ cardData.title }
			icon={ cardData.icon }
			isExpanded={ isExpanded }
			onToggle={ onToggle }
			cardData={ cardData }
		>
			<BaseControl __nextHasNoMarginBottom={ true }>
				{ ! isValidSalesforceOrgId( salesforceData.organizationId ) && (
					<p style={ { marginBottom: '20px' } }>
						{ __(
							'To connect this form to Salesforce, first add a valid Salesforce organization ID.',
							'jetpack-forms'
						) }
					</p>
				) }
				<TextControl
					label={ __( 'Organization ID', 'jetpack-forms' ) }
					value={ salesforceData.organizationId || '' }
					placeholder={ __( 'Enter your Organization ID', 'jetpack-forms' ) }
					onBlur={ onBlurOrgIdField }
					onChange={ setOrganizationId }
					help={ __( 'Enter the Salesforce organization ID to send leads to.', 'jetpack-forms' ) }
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize={ true }
				/>
				{ organizationIdError && (
					<HelpMessage isError style={ { marginTop: '8px' } }>
						{ __(
							'Invalid Organization ID. Should be a 15 – 18 characters long alphanumeric string.',
							'jetpack-forms'
						) }
					</HelpMessage>
				) }
				<ExternalLink href="https://help.salesforce.com/s/articleView?id=000325251&type=1">
					{ __( 'Where to find your Salesforce Organization ID', 'jetpack-forms' ) }
				</ExternalLink>
			</BaseControl>
		</IntegrationCard>
	);
};

export default SalesforceCard;
