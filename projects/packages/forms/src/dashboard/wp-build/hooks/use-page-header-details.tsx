/**
 * External dependencies
 */
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
/**
 * WordPress dependencies
 */
import { Breadcrumbs } from '@wordpress/admin-ui';
import { store as coreDataStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import CreateFormButton from '../../components/create-form-button';
import EditFormButton from '../../components/edit-form-button';
import EmptySpamButton from '../../components/empty-spam-button';
import EmptyTrashButton from '../../components/empty-trash-button';
import ExportResponsesButton from '../../components/export-responses/button';
import ManageIntegrationsButton from '../components/manage-integrations-button';
import type { ReactNode } from 'react';

type ResponsesStatusView = 'inbox' | 'spam' | 'trash';

type UsePageHeaderDetailsProps = {
	screen: 'forms' | 'responses';
	statusView?: ResponsesStatusView;
	sourceId?: string | number;
	isIntegrationsEnabled: boolean;
	showDashboardIntegrations: boolean;
	onOpenIntegrations: () => void;
};

type UsePageHeaderDetailsReturn = {
	breadcrumbs: ReactNode;
	subtitle: ReactNode;
	actions?: ReactNode;
};

/**
 * Build wp-build page header details (breadcrumbs, subtitle, actions).
 *
 * This hook is intentionally scoped to just what is passed into the wp-build `<Page />`
 * component to keep route files readable.
 *
 * @param props - Props.
 * @return Page header details.
 */
export default function usePageHeaderDetails(
	props: UsePageHeaderDetailsProps
): UsePageHeaderDetailsReturn {
	const { screen, sourceId, isIntegrationsEnabled, showDashboardIntegrations, onOpenIntegrations } =
		props;
	const statusView: ResponsesStatusView = props.statusView ?? 'inbox';
	const sourceIdNumber = useMemo( () => {
		const value = sourceId;
		const numberValue = typeof value === 'number' ? value : Number( value );
		return Number.isFinite( numberValue ) && numberValue > 0 ? numberValue : null;
	}, [ sourceId ] );

	// Mutually-exclusive screen flags.
	const isFormsScreen = screen === 'forms';
	const isSingleFormScreen = screen === 'responses' && sourceIdNumber !== null;

	const formRecord = useSelect(
		select =>
			sourceIdNumber
				? ( select( coreDataStore ).getEntityRecord(
						'postType',
						'jetpack_form',
						sourceIdNumber
				  ) as { title?: { rendered?: string } } | undefined )
				: undefined,
		[ sourceIdNumber ]
	);

	const formTitle = useMemo( () => {
		const rendered = formRecord?.title?.rendered || '';
		return decodeEntities( rendered );
	}, [ formRecord?.title?.rendered ] );

	const breadcrumbsItems = useMemo( () => {
		if ( isSingleFormScreen ) {
			return [
				{ label: __( 'Forms', 'jetpack-forms' ), to: '/forms' },
				{ label: formTitle || __( 'Form responses', 'jetpack-forms' ) },
			];
		}

		return [ { label: __( 'Forms', 'jetpack-forms' ) } ];
	}, [ formTitle, isSingleFormScreen ] );

	const breadcrumbs = useMemo( () => {
		return (
			<Stack align="center" gap="xs">
				<JetpackLogo showText={ false } width={ 20 } />
				<Breadcrumbs items={ breadcrumbsItems } />
			</Stack>
		);
	}, [ breadcrumbsItems ] );

	const subtitle = useMemo( () => {
		if ( isFormsScreen ) {
			return __( 'View and manage all your forms in one place.', 'jetpack-forms' );
		}

		if ( isSingleFormScreen ) {
			if ( formTitle ) {
				return sprintf(
					/* translators: %s: form name */
					__( 'View responses for %s.', 'jetpack-forms' ),
					formTitle
				);
			}
			return __( 'View responses for this form.', 'jetpack-forms' );
		}

		return __( 'View and manage all your form submissions in one place.', 'jetpack-forms' );
	}, [ formTitle, isFormsScreen, isSingleFormScreen ] );

	const actions = useMemo( () => {
		if ( isFormsScreen ) {
			return [
				...( isIntegrationsEnabled && showDashboardIntegrations
					? [ <ManageIntegrationsButton key="integrations" onClick={ onOpenIntegrations } /> ]
					: [] ),
				<CreateFormButton key="create" variant="primary" showIcon={ false } />,
			];
		}

		if ( isSingleFormScreen ) {
			return [
				...( sourceIdNumber
					? [ <EditFormButton key="edit-form" formId={ sourceIdNumber } /> ]
					: [] ),
				<ExportResponsesButton
					key="export"
					isPrimary={ statusView === 'inbox' }
					showIcon={ false }
				/>,
				...( statusView === 'trash' ? [ <EmptyTrashButton key="empty-trash" /> ] : [] ),
				...( statusView === 'spam' ? [ <EmptySpamButton key="empty-spam" /> ] : [] ),
			];
		}

		// Responses list screen.
		return [
			...( statusView === 'inbox' && isIntegrationsEnabled && showDashboardIntegrations
				? [ <ManageIntegrationsButton key="integrations" onClick={ onOpenIntegrations } /> ]
				: [] ),
			...( statusView === 'inbox'
				? [
						<CreateFormButton
							key="create"
							variant="secondary"
							showPatterns={ false }
							showIcon={ false }
						/>,
				  ]
				: [] ),
			<ExportResponsesButton
				key="export"
				isPrimary={ statusView === 'inbox' }
				showIcon={ false }
			/>,
			...( statusView === 'trash' ? [ <EmptyTrashButton key="empty-trash" /> ] : [] ),
			...( statusView === 'spam' ? [ <EmptySpamButton key="empty-spam" /> ] : [] ),
		];
	}, [
		isIntegrationsEnabled,
		onOpenIntegrations,
		showDashboardIntegrations,
		sourceIdNumber,
		isFormsScreen,
		isSingleFormScreen,
		statusView,
	] );

	return { breadcrumbs, subtitle, actions };
}
