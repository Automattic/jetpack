import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { useMemo } from 'react';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';

type NeedsPluginsAlert =
	RedBubbleAlerts[ `${ JetpackPlanSlug }--plugins_needing_installed_activated` ];

export const useGetPaidPlanNeedsPluginsContent = ( {
	alert,
	planName,
	planPurchaseId,
	numPluginsNeedingAction,
}: {
	alert: NeedsPluginsAlert;
	planName: string;
	planPurchaseId: string;
	numPluginsNeedingAction: number;
} ) => {
	const { needs_installed, needs_activated_only } = alert || {};

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

	const noticeMessagesSingular = {
		install_activate: sprintf(
			// translators: %s is the name of the Jetpack paid plan, i.e.- "Jetpack Security".
			__(
				'To get the most out of your <link>%s paid subscription</link> and have access to all its features, we recommend you install and/or activate the following plugin:',
				'jetpack-my-jetpack'
			),
			planName
		),
		install: sprintf(
			// translators: %s is the name of the Jetpack paid plan, i.e.- "Jetpack Security".
			__(
				'To get the most out of your <link>%s paid subscription</link> and have access to all its features, we recommend you install and activate the following plugin:',
				'jetpack-my-jetpack'
			),
			planName
		),
		activate: sprintf(
			// translators: %s is the name of the Jetpack paid plan, i.e.- "Jetpack Security".
			__(
				'To get the most out of your <link>%s paid subscription</link> and have access to all its features, we recommend you activate the following plugin:',
				'jetpack-my-jetpack'
			),
			planName
		),
	};

	const noticeMessagesPlural = {
		install_activate: sprintf(
			// translators: %1$s is the name of the Jetpack paid plan, i.e.- "Jetpack Security", and %2$d is the number of plugins.
			_n(
				'To get the most out of your <link>%1$s paid subscription</link> and have access to all its features, we recommend you install and/or activate the following %2$d plugin:',
				'To get the most out of your <link>%1$s paid subscription</link> and have access to all its features, we recommend you install and/or activate the following %2$d plugins:',
				numPluginsNeedingAction,
				'jetpack-my-jetpack'
			),
			planName,
			numPluginsNeedingAction
		),
		install: sprintf(
			// translators: %1$s is the name of the Jetpack paid plan, i.e.- "Jetpack Security", and %2$d is the number of plugins.
			_n(
				'To get the most out of your <link>%1$s paid subscription</link> and have access to all its features, we recommend you install and activate the following %2$d plugin:',
				'To get the most out of your <link>%1$s paid subscription</link> and have access to all its features, we recommend you install and activate the following %2$d plugins:',
				numPluginsNeedingAction,
				'jetpack-my-jetpack'
			),
			planName,
			numPluginsNeedingAction
		),
		activate: sprintf(
			// translators: %1$s is the name of the Jetpack paid plan, i.e.- "Jetpack Security", and %2$d is the number of plugins.
			_n(
				'To get the most out of your <link>%1$s paid subscription</link> and have access to all its features, we recommend you activate the following %2$d plugin:',
				'To get the most out of your <link>%1$s paid subscription</link> and have access to all its features, we recommend you activate the following %2$d plugins:',
				numPluginsNeedingAction,
				'jetpack-my-jetpack'
			),
			planName,
			numPluginsNeedingAction
		),
	};

	const buttonLabelsSingular = {
		install_activate: __( 'Install and/or activate plugin in one click', 'jetpack-my-jetpack' ),
		install: __( 'Install and activate plugin in one click', 'jetpack-my-jetpack' ),
		activate: __( 'Activate plugin in one click', 'jetpack-my-jetpack' ),
	};

	const buttonLabelsPlural = {
		install_activate: sprintf(
			/* translators: %d is the number of plugins. */
			_n(
				'Install and/or activate %d plugin in one click',
				'Install and/or activate %d plugins in one click',
				numPluginsNeedingAction,
				'jetpack-my-jetpack'
			),
			numPluginsNeedingAction
		),
		install: sprintf(
			/* translators: %d is the number of plugins. */
			_n(
				'Install and activate %d plugin in one click',
				'Install and activate %d plugins in one click',
				numPluginsNeedingAction,
				'jetpack-my-jetpack'
			),
			numPluginsNeedingAction
		),
		activate: sprintf(
			/* translators: %d is the number of plugins. */
			_n(
				'Activate %d plugin in one click',
				'Activate %d plugins in one click',
				numPluginsNeedingAction,
				'jetpack-my-jetpack'
			),
			numPluginsNeedingAction
		),
	};

	const isSinglePlugin = numPluginsNeedingAction === 1;

	const noticeTitle = isSinglePlugin
		? noticeTitleSingular[ actionType ]
		: noticeTitlePlural[ actionType ];

	const noticeMessage = createInterpolateElement(
		isSinglePlugin ? noticeMessagesSingular[ actionType ] : noticeMessagesPlural[ actionType ],
		{
			link: (
				<Link
					openInNewTab
					href={ getRedirectUrl( 'jetpack-subscription-renew', {
						site: siteSuffix,
						path: planPurchaseId,
					} ) }
					children={ null }
				/>
			),
		}
	);

	const buttonLabel = isSinglePlugin
		? buttonLabelsSingular[ actionType ]
		: buttonLabelsPlural[ actionType ];

	return {
		noticeTitle,
		noticeMessage,
		buttonLabel,
	};
};
