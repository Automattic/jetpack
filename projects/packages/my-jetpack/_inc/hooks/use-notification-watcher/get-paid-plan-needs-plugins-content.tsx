import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';

type NeedsPluginsAlert =
	RedBubbleAlerts[ `${ JetpackPlanSlug }--plugins_needing_installed_activated` ];

export const useGetPaidPlanNeedsPluginsContent = ( {
	alert,
	planName,
	planPurchaseId,
}: {
	alert: NeedsPluginsAlert;
	planName: string;
	planPurchaseId: string;
} ) => {
	const { needs_installed, needs_activated_only } = alert || {};
	const numPluginsNeedingAction =
		( needs_installed?.length ?? 0 ) + ( needs_activated_only?.length ?? 0 );

	const { siteSuffix } = getMyJetpackWindowInitialState();

	const actionType = useMemo( () => {
		if ( needs_installed && needs_activated_only ) {
			return 'install_activate';
		} else if ( needs_installed ) {
			return 'install';
		}
		return 'activate';
	}, [ needs_activated_only, needs_installed ] );

	const noticeTitleSingular = {
		install_activate: __( 'Plugin installation and activation needed', 'jetpack-my-jetpack' ),
		install: __( 'Plugin installation needed', 'jetpack-my-jetpack' ),
		activate: __( 'Plugin activation needed', 'jetpack-my-jetpack' ),
	};

	const noticeTitlePlural = {
		install_activate: __(
			'Some plugins need to be installed and/or activated',
			'jetpack-my-jetpack'
		),
		install: __( 'Some plugins need to be installed', 'jetpack-my-jetpack' ),
		activate: __( 'Some plugins need to be activated', 'jetpack-my-jetpack' ),
	};

	const noticeMessages = {
		install_activate: createInterpolateElement(
			sprintf(
				// translators: %1$s is the name of the Jetpack paid plan, i.e.- "Jetpack Security", and %2$s word "plugin" as singular, or plural ("plugins").
				__(
					'To get the most out of your <link>%1$s paid subscription</link> and have access to all it’s features, we recommend you install and/or activate the following %2$s:',
					'jetpack-my-jetpack'
				),
				planName,
				_n( 'plugin', 'plugins', numPluginsNeedingAction, 'jetpack-my-jetpack' )
			),
			{
				link: (
					<ExternalLink
						href={ getRedirectUrl( 'jetpack-subscription-renew', {
							site: siteSuffix,
							path: planPurchaseId,
						} ) }
					/>
				),
			}
		),
		install: createInterpolateElement(
			sprintf(
				// translators: %1$s is the name of the Jetpack paid plan, i.e.- "Jetpack Security", and %2$s word "plugin" as singular, or plural ("plugins").
				__(
					'To get the most out of your <link>%1$s paid subscription</link> and have access to all it’s features, we recommend you install and activate the following %2$s:',
					'jetpack-my-jetpack'
				),
				planName,
				_n( 'plugin', 'plugins', numPluginsNeedingAction, 'jetpack-my-jetpack' )
			),
			{
				link: (
					<ExternalLink
						href={ getRedirectUrl( 'jetpack-subscription-renew', {
							site: siteSuffix,
							path: planPurchaseId,
						} ) }
					/>
				),
			}
		),
		activate: createInterpolateElement(
			sprintf(
				// translators: %1$s is the name of the Jetpack paid plan, i.e.- "Jetpack Security", and %2$s word "plugin" as singular, or plural ("plugins").
				__(
					'To get the most out of your <link>%1$s paid subscription</link> and have access to all it’s features, we recommend you activate the following %2$s:',
					'jetpack-my-jetpack'
				),
				planName,
				_n( 'plugin', 'plugins', numPluginsNeedingAction, 'jetpack-my-jetpack' )
			),
			{
				link: (
					<ExternalLink
						href={ getRedirectUrl( 'jetpack-subscription-renew', {
							site: siteSuffix,
							path: planPurchaseId,
						} ) }
					/>
				),
			}
		),
	};

	const buttonLabels = {
		install_activate: sprintf(
			/* translators: %1$s is "plugin" or "plugins" (singular/plural) */
			__( 'Install and/or activate %1$s in one click', 'jetpack-my-jetpack' ),
			_n( 'plugin', 'plugins', numPluginsNeedingAction, 'jetpack-my-jetpack' )
		),
		install: sprintf(
			/* translators: %1$s is "plugin" or "plugins" (singular/plural) */
			__( 'Install and activate %1$s in one click', 'jetpack-my-jetpack' ),
			_n( 'plugin', 'plugins', numPluginsNeedingAction, 'jetpack-my-jetpack' )
		),
		activate: sprintf(
			/* translators: %1$s is "plugin" or "plugins" (singular/plural) */
			__( 'Activate %1$s in one click', 'jetpack-my-jetpack' ),
			_n( 'plugin', 'plugins', numPluginsNeedingAction, 'jetpack-my-jetpack' )
		),
	};

	const noticeTitle =
		numPluginsNeedingAction === 1
			? noticeTitleSingular[ actionType ]
			: noticeTitlePlural[ actionType ];

	const noticeMessage = noticeMessages[ actionType ];

	const buttonLabel = buttonLabels[ actionType as keyof typeof buttonLabels ];

	return {
		noticeTitle,
		noticeMessage,
		buttonLabel,
	};
};
