/**
 * External dependencies
 */
import { Badge } from '@automattic/ui';
import '@automattic/ui/style.css';
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import IntegrationCard from '../../blocks/contact-form/components/jetpack-integrations-modal/integration-card';
import SalesforceIcon from '../../icons/salesforce';
import useCreateForm from '../hooks/use-create-form';
/**
 * Types
 */
import type { SingleIntegrationCardProps, IntegrationCardData } from '../../types';

const SalesforceDashboardCard = ( {
	isExpanded,
	onToggle,
	data,
	refreshStatus,
}: SingleIntegrationCardProps ) => {
	const { openNewForm } = useCreateForm();
	const handleCreateSalesforceForm = useCallback( () => {
		openNewForm( {
			formPattern: 'salesforce-lead-form',
			analyticsEvent: () => {
				if ( window.jetpackAnalytics?.tracks ) {
					window.jetpackAnalytics.tracks.recordEvent( 'jetpack_forms_salesforce_lead_form_click' );
				}
			},
		} );
	}, [ openNewForm ] );
	const cardData: IntegrationCardData = {
		...data,
		showHeaderToggle: false, // Always off for dashboard
		isLoading: ! data || typeof data.isInstalled === 'undefined',
		refreshStatus,
		setupBadge: (
			<Badge intent="success" className="integration-card__setup-badge">
				{ __( 'Configured per form', 'jetpack-forms' ) }
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
			<div>
				<p className="integration-card__description">
					{ __(
						'Salesforce connections are managed for each form individually in the block editor.',
						'jetpack-forms'
					) }
				</p>
				<Button
					variant="primary"
					onClick={ handleCreateSalesforceForm }
					className="jp-forms__create-form-button--large-green"
				>
					{ __( 'Create Salesforce Lead Form', 'jetpack-forms' ) }
				</Button>
			</div>
		</IntegrationCard>
	);
};

export default SalesforceDashboardCard;
