/**
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-script-data';
import {
	Button,
	ExternalLink,
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { createInterpolateElement, useCallback, useMemo } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
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
	status: string;
	isSearch: boolean;
	readStatusFilter?: 'unread' | 'read';
};

type EmptyWrapperProps = {
	heading?: string;
	body?: string | ReactNode;
	actions?: ReactNode;
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
			moreInfoLink: <ExternalLink href="https://akismet.com/" children={ null } />,
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

export const EmptyWrapper = ( { heading = '', body = '', actions = null }: EmptyWrapperProps ) => (
	<VStack alignment="center" spacing="2">
		{ heading && (
			<Text as="h3" weight="500" size="15">
				{ heading }
			</Text>
		) }
		{ body && <Text variant="muted">{ body }</Text> }
		{ actions && <span style={ { marginBlockStart: '16px' } }>{ actions }</span> }
	</VStack>
);

const EmptyResponses = ( { status, isSearch, readStatusFilter }: EmptyResponsesProps ) => {
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
	const searchHeading = __( 'No results found', 'jetpack-forms' );
	const searchMessage = __(
		"Try adjusting your search or filters to find what you're looking for.",
		'jetpack-forms'
	);
	if ( isSearch || hasReadStatusFilter ) {
		return <EmptyWrapper heading={ searchHeading } body={ searchMessage } />;
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
			<EmptyWrapper heading={ noTrashHeading } body={ emptyTrashDays > 0 && noTrashMessage } />
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
				<EmptyWrapper
					heading={ noSpamHeading }
					body={ wrapperBody }
					actions={
						<Button
							variant="primary"
							isBusy={ isInstallingAkismet }
							disabled={ isInstallingAkismet || ! canPerformAkismetAction }
							onClick={ handleAkismetSetup }
							__next40pxDefaultSize
						>
							{ wrapperButtonText }
						</Button>
					}
				/>
			);
		}

		return <EmptyWrapper heading={ noSpamHeading } body={ noSpamMessage } />;
	}

	return (
		<EmptyWrapper
			heading={ __( "You're set up. No responses yet.", 'jetpack-forms' ) }
			body={ __(
				'Share your form to start collecting responses. New items will appear here.',
				'jetpack-forms'
			) }
			actions={
				<CreateFormButton label={ __( 'Create a new form', 'jetpack-forms' ) } variant="primary" />
			}
		/>
	);
};

export default EmptyResponses;
