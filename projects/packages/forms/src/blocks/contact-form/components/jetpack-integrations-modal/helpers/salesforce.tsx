import { Badge } from '@automattic/ui';
import '@automattic/ui/style.css';
import { BaseControl, ExternalLink, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import SalesforceIcon from '../../../../../icons/salesforce.tsx';
import HelpMessage from '../../help-message/index.js';
import CreateSalesforceLeadFormButton from '../components/create-salesforce-lead-form-button.tsx';
import type { CardItem, CardBuilderProps } from './types.ts';

export const isValidSalesforceOrgId = ( id: string | undefined ): boolean =>
	typeof id === 'string' && /^[a-zA-Z0-9]{15,18}$/.test( id.trim() );

export function buildSalesforceCard( {
	integration,
	refreshIntegrations,
	context,
	attributes,
	setAttributes,
}: CardBuilderProps ): CardItem {
	const organizationId = attributes?.salesforceData?.organizationId ?? '';
	const sendToSalesforce = !! attributes?.salesforceData?.sendToSalesforce;

	const base: CardItem = {
		id: integration.id,
		title: integration.title,
		description: integration.subtitle,
		icon: <SalesforceIcon width={ 32 } height={ 32 } />,
		cardData: {
			...integration,
			isLoading: typeof integration.isInstalled === 'undefined',
			refreshStatus: refreshIntegrations,
			showHeaderToggle: context === 'block-editor',
			...( context === 'block-editor' && {
				headerToggleValue: sendToSalesforce,
				isHeaderToggleEnabled: isValidSalesforceOrgId( organizationId ),
				onHeaderToggleChange: ( value: boolean ) =>
					setAttributes?.( {
						salesforceData: {
							...( attributes?.salesforceData ?? {} ),
							sendToSalesforce: value,
						},
					} ),
				toggleDisabledTooltip: ! isValidSalesforceOrgId( organizationId )
					? __( 'Enter a Salesforce Organization ID to enable.', 'jetpack-forms' )
					: undefined,
				isConnected: isValidSalesforceOrgId( organizationId ),
			} ),
			setupBadge:
				context === 'dashboard' ? (
					<Badge intent="success" className="integration-card__setup-badge">
						{ __( 'Configured per form', 'jetpack-forms' ) }
					</Badge>
				) : (
					<Badge intent="default" className="integration-card__setup-badge">
						{ __( 'Enter organization ID', 'jetpack-forms' ) }
					</Badge>
				),
		},
		body:
			context === 'block-editor' ? (
				<BaseControl __nextHasNoMarginBottom={ true }>
					<TextControl
						label={ __( 'Organization ID', 'jetpack-forms' ) }
						value={ organizationId }
						onChange={ ( newId: string ) =>
							setAttributes?.( {
								salesforceData: {
									...( attributes?.salesforceData ?? {} ),
									organizationId: newId.trim(),
								},
							} )
						}
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
						style={ { maxWidth: '300px' } }
					/>
					{ organizationId && ! isValidSalesforceOrgId( organizationId ) && (
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
					<div style={ { marginTop: '20px', marginBottom: '20px' } }>
						{ __(
							'For integration with Salesforce to work, you must add specific fields with specific field IDs that match Salesforce.',
							'jetpack-forms'
						) }
					</div>
				</BaseControl>
			) : (
				<div>
					<p className="integration-card__description">
						{ __(
							'Salesforce connections are managed for each form individually in the block editor.',
							'jetpack-forms'
						) }
					</p>
					<CreateSalesforceLeadFormButton className="jp-forms__create-form-button--large-green" />
				</div>
			),
	};

	return base;
}
