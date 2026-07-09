/**
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-script-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { createInterpolateElement, useCallback, useMemo } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { caution, page, search, shield, trash } from '@wordpress/icons';
import { Button, EmptyState, Link } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../hooks/use-config-value.ts';
import { usePluginInstallation } from '../../../hooks/use-plugin-installation.ts';
import { INTEGRATIONS_STORE } from '../../../store/integrations/index.ts';
import CreateFormButton from '../create-form-button/index.tsx';
/**
 * Types
 */
import type {
	IntegrationsDispatch,
	SelectIntegrations,
} from '../../../store/integrations/index.ts';
import type { Integration } from '../../../types/index.ts';
import type { ReactNode } from 'react';

type UseInstallAkismetReturn = {
	shouldShowAkismetCta: boolean;
	wrapperBody: ReactNode;
	isInstallingAkismet: boolean;
	canPerformAkismetAction: boolean;
	wrapperButtonText: string;
	handleAkismetSetup: () => Promise< void >;
};

type EmptyResponsesProps = {
	isSearch: boolean;
	isSingleFormView?: boolean;
	readStatusFilter?: 'unread' | 'read';
	status: string;
	/** Whether the form isn't collecting responses anywhere (email + saving off). */
	isNotCollecting?: boolean;
	/** Editor URL the not-collecting empty state's "set up" button links to. */
	notCollectingEditUrl?: string;
};

/**
 * Hook to handle Akismet installation and activation.
 *
 * @return {UseInstallAkismetReturn} An object containing the necessary data and functions to handle Akismet installation and activation.
 */
const useInstallAkismet = (): UseInstallAkismetReturn => {
	const { akismetIntegration } = useSelect( ( select: SelectIntegrations ) => {
		const store = select( INTEGRATIONS_STORE );
		const integrations = store.getIntegrations() || [];

		return {
			akismetIntegration: integrations.find(
				( integration: Integration ) => integration.id === 'akismet'
			),
		};
	}, [] ) as { akismetIntegration?: Integration };

	const { refreshIntegrations } = useDispatch( INTEGRATIONS_STORE ) as IntegrationsDispatch;

	const akismetIntegrationReady = useMemo(
		() => !! akismetIntegration && ! akismetIntegration.__isPartial,
		[ akismetIntegration ]
	);

	const isInstalled = !! akismetIntegration?.isInstalled;

	const isAkismetActive = akismetIntegrationReady && isInstalled && !! akismetIntegration?.isActive;

	const shouldShowAkismetCta = akismetIntegrationReady && ! isAkismetActive && ! isSimpleSite();

	const akismetPluginFile = useMemo(
		() => akismetIntegration?.pluginFile ?? 'akismet/akismet',
		[ akismetIntegration?.pluginFile ]
	);

	const wrapperBody: ReactNode = createInterpolateElement(
		__(
			'Want automatic spam filtering? Akismet Anti-spam protects millions of sites. <moreInfoLink>Learn more.</moreInfoLink>',
			'jetpack-forms'
		),
		{
			moreInfoLink: <Link openInNewTab href="https://akismet.com/" children={ null } />,
		}
	);

	const activateButtonText = __( 'Activate Akismet Anti-spam', 'jetpack-forms' );
	const installAndActivateButtonText = __( 'Install Akismet Anti-spam', 'jetpack-forms' );
	const wrapperButtonText = isInstalled ? activateButtonText : installAndActivateButtonText;

	const {
		isInstalling: isInstallingAkismet,
		installPlugin,
		canInstallPlugins,
		canActivatePlugins,
	} = usePluginInstallation( {
		slug: 'akismet',
		pluginPath: akismetPluginFile,
		isInstalled,
		onSuccess: refreshIntegrations,
		trackEventName: 'jetpack_forms_upsell_akismet_click',
		trackEventProps: {
			screen: 'dashboard',
		},
		successNotices: {
			install: {
				message: __( 'Akismet installed and activated.', 'jetpack-forms' ),
				options: { type: 'snackbar', id: 'akismet-install-success' },
			},
			activate: {
				message: __( 'Akismet activated.', 'jetpack-forms' ),
				options: { type: 'snackbar', id: 'akismet-install-success' },
			},
		},
		errorNotice: {
			message: __( 'Could not set up Akismet. Please try again.', 'jetpack-forms' ),
			options: { type: 'snackbar', id: 'akismet-install-error' },
		},
	} );

	const canPerformAkismetAction =
		isInstalled && akismetIntegrationReady
			? canActivatePlugins !== false
			: canInstallPlugins !== false;

	const handleAkismetSetup = useCallback( async () => {
		if ( isInstallingAkismet || ! akismetIntegrationReady || ! canPerformAkismetAction ) {
			return;
		}

		await installPlugin();
	}, [ isInstallingAkismet, akismetIntegrationReady, canPerformAkismetAction, installPlugin ] );

	return {
		shouldShowAkismetCta,
		wrapperBody,
		isInstallingAkismet,
		canPerformAkismetAction,
		wrapperButtonText,
		handleAkismetSetup,
	};
};

export const NoResults = () => (
	<EmptyState.Root>
		<EmptyState.Icon icon={ search } />
		<EmptyState.Title>{ __( 'No results found', 'jetpack-forms' ) }</EmptyState.Title>
		<EmptyState.Description>
			{ __(
				"Try adjusting your search or filters to find what you're looking for.",
				'jetpack-forms'
			) }
		</EmptyState.Description>
	</EmptyState.Root>
);

const EmptyResponses = ( {
	isSearch,
	isSingleFormView = false,
	readStatusFilter,
	status,
	isNotCollecting = false,
	notCollectingEditUrl,
}: EmptyResponsesProps ) => {
	const emptyTrashDays = useConfigValue( 'emptyTrashDays' ) ?? 0;
	const {
		shouldShowAkismetCta,
		wrapperBody,
		isInstallingAkismet,
		canPerformAkismetAction,
		wrapperButtonText,
		handleAkismetSetup,
	} = useInstallAkismet();

	// Handle search and filter states first
	const hasReadStatusFilter = !! readStatusFilter;
	if ( isSearch || hasReadStatusFilter ) {
		return <NoResults />;
	}

	const noTrashHeading = __( 'Trash is empty', 'jetpack-forms' );
	const noTrashMessage = sprintf(
		/* translators: %d number of days. */
		_n(
			'Items in trash are permanently deleted after %d day.',
			'Items in trash are permanently deleted after %d days.',
			emptyTrashDays,
			'jetpack-forms'
		),
		emptyTrashDays
	);
	if ( status === 'trash' ) {
		return (
			<EmptyState.Root>
				<EmptyState.Icon icon={ trash } />
				<EmptyState.Title>{ noTrashHeading }</EmptyState.Title>
				{ emptyTrashDays > 0 && (
					<EmptyState.Description>{ noTrashMessage }</EmptyState.Description>
				) }
			</EmptyState.Root>
		);
	}

	const noSpamHeading = __( 'Lucky you, no spam!', 'jetpack-forms' );
	const noSpamMessage = __(
		'Spam responses are permanently deleted after 15 days.',
		'jetpack-forms'
	);

	if ( status === 'spam' ) {
		if ( shouldShowAkismetCta ) {
			return (
				<EmptyState.Root>
					<EmptyState.Icon icon={ shield } />
					<EmptyState.Title>{ noSpamHeading }</EmptyState.Title>
					<EmptyState.Description>{ wrapperBody }</EmptyState.Description>
					<EmptyState.Actions>
						<Button
							variant="solid"
							loading={ isInstallingAkismet }
							disabled={ isInstallingAkismet || ! canPerformAkismetAction }
							onClick={ handleAkismetSetup }
						>
							{ wrapperButtonText }
						</Button>
					</EmptyState.Actions>
				</EmptyState.Root>
			);
		}

		return (
			<EmptyState.Root>
				<EmptyState.Icon icon={ shield } />
				<EmptyState.Title>{ noSpamHeading }</EmptyState.Title>
				<EmptyState.Description>{ noSpamMessage }</EmptyState.Description>
			</EmptyState.Root>
		);
	}

	// A single form that isn't collecting responses anywhere: surface the warning
	// front and center in place of the responses table, rather than the generic
	// "no responses yet" message, so the problem is impossible to miss and the
	// messaging doesn't contradict itself.
	if ( isSingleFormView && isNotCollecting ) {
		return (
			<EmptyState.Root>
				<EmptyState.Icon icon={ caution } />
				<EmptyState.Title>
					{ __( 'This form isn’t collecting responses', 'jetpack-forms' ) }
				</EmptyState.Title>
				<EmptyState.Description>
					{ __(
						'Submissions are silently dropped because this form has nowhere to send them.',
						'jetpack-forms'
					) }
				</EmptyState.Description>
				{ notCollectingEditUrl && (
					<EmptyState.Actions>
						<Button variant="outline" render={ <a href={ notCollectingEditUrl } /> }>
							{ __( 'Choose where responses go', 'jetpack-forms' ) }
						</Button>
					</EmptyState.Actions>
				) }
			</EmptyState.Root>
		);
	}

	return (
		<EmptyState.Root>
			<EmptyState.Icon icon={ page } />
			<EmptyState.Title>
				{ __( "You're set up. No responses yet.", 'jetpack-forms' ) }
			</EmptyState.Title>
			<EmptyState.Description>
				{ __(
					'Share your form to start collecting responses. New items will appear here.',
					'jetpack-forms'
				) }
			</EmptyState.Description>
			{ ! isSingleFormView && (
				<EmptyState.Actions>
					<CreateFormButton
						label={ __( 'Create a new form', 'jetpack-forms' ) }
						variant="primary"
						showNameModal
					/>
				</EmptyState.Actions>
			) }
		</EmptyState.Root>
	);
};

export default EmptyResponses;
