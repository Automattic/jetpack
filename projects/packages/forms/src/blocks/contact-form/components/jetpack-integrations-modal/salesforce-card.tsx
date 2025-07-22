import { Badge } from '@automattic/ui';
import '@automattic/ui/style.css';
import { TextControl, BaseControl, ExternalLink } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import SalesforceIcon from '../../../../icons/salesforce';
import HelpMessage from '../help-message';
import IntegrationCard from './integration-card';
import type { SingleIntegrationCardProps } from '../../../../types';
import type { FocusEvent } from 'react';

export function isValidSalesforceOrgId( id: string | undefined ): boolean {
	return typeof id === 'string' && /^[a-zA-Z0-9]{15,18}$/.test( id.trim() );
}

type SalesforceData = {
	organizationId?: string;
	sendToSalesforce?: boolean;
};

type SalesforceCardProps = SingleIntegrationCardProps & {
	salesforceData: SalesforceData;
	setAttributes: ( attrs: { salesforceData: SalesforceData } ) => void;
};

const SalesforceCard = ( {
	isExpanded,
	onToggle,
	data,
	refreshStatus,
	salesforceData = {},
	setAttributes,
}: SalesforceCardProps ) => {
	const [ organizationIdError, setOrganizationIdError ] = useState( false );

	const onHeaderToggleChange = ( value: boolean ) => {
		setAttributes( {
			salesforceData: {
				...salesforceData,
				sendToSalesforce: value,
			},
		} );
	};

	const setOrganizationId = ( value: string ) => {
		setOrganizationIdError( false );
		setAttributes( {
			salesforceData: {
				...salesforceData,
				organizationId: value.trim(),
			},
		} );
	};

	const onBlurOrgIdField = ( e: FocusEvent< HTMLInputElement > ) => {
		setOrganizationIdError( ! isValidSalesforceOrgId( e.target.value ) );
	};

	const cardData = {
		...data,
		showHeaderToggle: true,
		headerToggleValue: salesforceData?.sendToSalesforce || false,
		isHeaderToggleEnabled: isValidSalesforceOrgId( salesforceData.organizationId ),
		onHeaderToggleChange,
		isConnected: isValidSalesforceOrgId( salesforceData.organizationId ),
		isLoading: ! data || typeof data.isInstalled === 'undefined',
		refreshStatus,
		toggleDisabledTooltip: ! isValidSalesforceOrgId( salesforceData.organizationId )
			? __( 'Enter a Salesforce Organization ID to enable.', 'jetpack-forms' )
			: undefined,
		setupBadge: (
			<Badge intent="default" className="integration-card__setup-badge">
				{ __( 'Enter organization ID', 'jetpack-forms' ) }
			</Badge>
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

				{ /* Salesforce integration documentation section */ }
				<div style={ { marginTop: '20px', marginBottom: '20px' } }>
					<strong>
						{ __(
							'For integration with Salesforce to work, you must add specific fields with specific field IDs that match Salesforce.',
							'jetpack-forms'
						) }
					</strong>
					<p>
						{ __(
							"Note: to add an ID to any field, select the field block, click Advanced on the block sidebar settings, and add the ID to the 'Name/ID' field. If you do not see Name/ID, be sure you've selected the whole field block, not just the label or input.",
							'jetpack-forms'
						) }
					</p>
					<p>
						{ __(
							'Here are suggested and supported fields. You can see a complete list in your Salesforce account by creating a Marketing > Web-to-Lead form.',
							'jetpack-forms'
						) }
					</p>
					<ul>
						<li>
							{ __( 'First Name (ID must be', 'jetpack-forms' ) } <code>first_name</code>)
						</li>
						<li>
							{ __( 'Last Name (ID must be', 'jetpack-forms' ) } <code>last_name</code>)
						</li>
						<li>
							{ __( 'Email (ID must be', 'jetpack-forms' ) } <code>email</code>)
						</li>
						<li>
							{ __( 'Phone (ID must be', 'jetpack-forms' ) } <code>phone</code>)
						</li>
						<li>
							{ __( 'Company (ID must be', 'jetpack-forms' ) } <code>company</code>)
						</li>
						<li>
							{ __( 'Job Title (ID must be', 'jetpack-forms' ) } <code>title</code>)
						</li>
					</ul>
				</div>
			</BaseControl>
		</IntegrationCard>
	);
};

export default SalesforceCard;
