import { TextControl, BaseControl, ExternalLink, Icon } from '@wordpress/components';
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
		showHeaderToggle: true,
		headerToggleValue: salesforceData?.sendToSalesforce || false,
		isHeaderToggleEnabled: isValidSalesforceOrgId( salesforceData.organizationId ),
		onHeaderToggleChange,
		isConnected: isValidSalesforceOrgId( salesforceData.organizationId ),
		isLoading: typeof data.isInstalled === 'undefined',
		refreshStatus,
		toggleDisabledTooltip: ! isValidSalesforceOrgId( salesforceData.organizationId )
			? __( 'Enter a Salesforce Organization ID to enable.', 'jetpack-forms' )
			: undefined,
		setupBadge: (
			<span className="integration-card__setup-badge">
				<Icon icon="info-outline" size={ 12 } />
				{ __( 'Enter organization ID', 'jetpack-forms' ) }
			</span>
		),
	};

	return (
		<IntegrationCard
			title={ __( 'Salesforce', 'jetpack-forms' ) }
			description={ __( 'Send form contacts to Salesforce', 'jetpack-forms' ) }
			icon={ <SalesforceIcon width={ 32 } height={ 32 } /> }
			isExpanded={ isExpanded }
			onToggle={ onToggle }
			cardData={ cardData }
		>
			<BaseControl __nextHasNoMarginBottom={ true }>
				{ ! isValidSalesforceOrgId( salesforceData.organizationId ) && (
					<p className="integration-card__description" style={ { marginBottom: '20px' } }>
						{ __(
							'Enter the Salesforce organization ID where you want to send leads.',
							'jetpack-forms'
						) }
					</p>
				) }
				<TextControl
					label={ __( 'Organization ID', 'jetpack-forms' ) }
					value={
						salesforceData && typeof salesforceData.organizationId === 'string'
							? salesforceData.organizationId
							: ''
					}
					placeholder={ __( 'Enter your Organization ID', 'jetpack-forms' ) }
					onBlur={ onBlurOrgIdField }
					onChange={ setOrganizationId }
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize={ true }
					style={ { maxWidth: '300px' } }
				/>
				{ salesforceData.organizationId && organizationIdError && (
					<HelpMessage isError style={ { marginTop: '8px' } }>
						{ __(
							'Invalid Organization ID. Should be a 15–18 characters long alphanumeric string.',
							'jetpack-forms'
						) }
					</HelpMessage>
				) }
				<p>
					<ExternalLink href="https://help.salesforce.com/s/articleView?id=000325251&type=1">
						{ __( 'Where to find your Salesforce Organization ID', 'jetpack-forms' ) }
					</ExternalLink>
				</p>
			</BaseControl>
		</IntegrationCard>
	);
};

export default SalesforceCard;
