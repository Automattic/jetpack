import { Col, Text, getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useContext, useEffect, useMemo, useCallback } from 'react';
import { NOTICE_PRIORITY_MEDIUM } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import { QUERY_PURCHASES_KEY, REST_API_SITE_PURCHASES_ENDPOINT } from '../../data/constants';
import useActivatePlugins from '../../data/products/use-activate-plugins';
import useInstallPlugins from '../../data/products/use-install-plugins';
import useSimpleQuery from '../../data/use-simple-query';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import useAnalytics from '../use-analytics';
import type { NoticeOptions } from '../../context/notices/types';
import type { MyJetpackInitialState } from '../../data/types';

type RedBubbleAlerts = MyJetpackInitialState[ 'redBubbleAlerts' ];
type Purchase = MyJetpackInitialState[ 'purchases' ][ 'items' ][ 0 ];

const usePaidPlanNeedsPluginInstallActivationNotice = ( redBubbleAlerts: RedBubbleAlerts ) => {
	const { setNotice, resetNotice } = useContext( NoticeContext );
	const { recordEvent } = useAnalytics();

	const { isSiteConnected } = useMyJetpackConnection();
	const response = useSimpleQuery( {
		name: QUERY_PURCHASES_KEY,
		query: { path: REST_API_SITE_PURCHASES_ENDPOINT },
		options: { enabled: isSiteConnected },
	} );

	const { isLoading, isError } = response;
	const purchases = response.data as Purchase[];

	const isPurchasesDataLoaded = purchases && ! isLoading && ! isError;

	const pluginsNeedingActionAlerts = Object.keys( redBubbleAlerts ).filter( key =>
		key.endsWith( '--plugins_needing_installed_activated' )
	) as Array< `${ string }--plugins_needing_installed_activated` >;

	const alert = redBubbleAlerts[ pluginsNeedingActionAlerts[ 0 ] ];
	const alertSlug = pluginsNeedingActionAlerts[ 0 ];
	const planSlug = alertSlug?.split( '--' )[ 0 ];
	const planPurchase = useMemo( () => {
		return (
			isPurchasesDataLoaded && purchases.find( purchase => purchase.product_slug === planSlug )
		);
	}, [ isPurchasesDataLoaded, planSlug, purchases ] );
	const planName = planPurchase && planPurchase.product_name;
	const { needs_installed, needs_activated_only } = alert || {};
	const numPluginsNeedingAction =
		( needs_installed?.length ?? 0 ) + ( needs_activated_only?.length ?? 0 );

	const {
		siteSuffix,
		products: { items: products },
	} = getMyJetpackWindowInitialState();

	const getPluginInfo = useCallback(
		productSlug => ( {
			productSlug: productSlug,
			pluginSlug: products[ productSlug ].plugin_slug,
			pluginName:
				products[ productSlug ].plugin_slug === 'jetpack'
					? 'Jetpack'
					: products[ productSlug ].title,
			pluginUri: `https://wordpress.org/plugins/${ products[ productSlug ].plugin_slug }/`,
		} ),
		[ products ]
	);

	const pluginsList = useMemo( () => {
		if ( needs_installed && needs_activated_only ) {
			const slugs = new Set();
			return [ ...needs_installed, ...needs_activated_only ]
				.map( getPluginInfo )
				.filter( ( { pluginSlug } ) => ! slugs.has( pluginSlug ) && slugs.add( pluginSlug ) ); // filters out duplicates
		} else if ( needs_installed ) {
			const slugs = new Set();
			return needs_installed
				.map( getPluginInfo )
				.filter( ( { pluginSlug } ) => ! slugs.has( pluginSlug ) && slugs.add( pluginSlug ) );
		}
		const slugs = new Set();
		return needs_activated_only
			?.map( getPluginInfo )
			.filter( ( { pluginSlug } ) => ! slugs.has( pluginSlug ) && slugs.add( pluginSlug ) );
	}, [ getPluginInfo, needs_activated_only, needs_installed ] );

	const actionNoun = useMemo( () => {
		if ( needs_installed && needs_activated_only ) {
			return 'installation and/or activation';
		} else if ( needs_installed ) {
			return 'installation';
		}
		return 'activation';
	}, [ needs_activated_only, needs_installed ] );

	const actionVerb = useMemo( () => {
		if ( needs_installed && needs_activated_only ) {
			return 'install and/or activate';
		} else if ( needs_installed ) {
			return 'install and activate';
		}
		return 'activate';
	}, [ needs_activated_only, needs_installed ] );

	const { install: installAndActivatePlugins, isPending: isInstalling } =
		useInstallPlugins( needs_installed );
	const { activate: activatePlugins, isPending: isActivating } =
		useActivatePlugins( needs_activated_only );

	const handleInstallActivateInOneClick = useCallback( () => {
		recordEvent( 'jetpack_my_jetpack_plugin_needs_installed_notice_cta_click' );

		if ( needs_installed ) {
			installAndActivatePlugins( null, {
				onSuccess: () => {
					delete redBubbleAlerts[ pluginsNeedingActionAlerts[ 0 ] ];
					resetNotice();
				},
			} );
		}
		if ( needs_activated_only ) {
			activatePlugins( null, {
				onSuccess: () => {
					delete redBubbleAlerts[ pluginsNeedingActionAlerts[ 0 ] ];
					resetNotice();
				},
			} );
		}
	}, [
		recordEvent,
		needs_installed,
		needs_activated_only,
		installAndActivatePlugins,
		redBubbleAlerts,
		pluginsNeedingActionAlerts,
		resetNotice,
		activatePlugins,
	] );

	useEffect( () => {
		if ( pluginsNeedingActionAlerts.length === 0 || ! isPurchasesDataLoaded ) {
			return;
		}

		const noticeTitle = sprintf(
			/* translators: %s is the word(s), "installation", or "activation", or "installation and/or activation". */
			_n(
				'Plugin %s needed',
				'Some plugins need %s',
				numPluginsNeedingAction,
				'jetpack-my-jetpack'
			),
			actionNoun
		);

		const noticeMessage = (
			<>
				<Col>
					<Text mt={ 2 } mb={ 2 }>
						{ createInterpolateElement(
							sprintf(
								// translators: %1$s is the name of the Jetpack paid plan, i.e.- "Jetpack Security", %2$s is either "the [plugin name] plugin" or "the following plugins", and %3$s is a verb being either "installed", or "activated", or "installed and/or activated".
								__(
									'To get the most out of your <link>%1$s paid subscription</link> and have access to all it’s features, we recommend you %2$s the following %3$s:',
									'jetpack-my-jetpack'
								),
								planName,
								actionVerb,
								_n( 'plugin', 'plugins', numPluginsNeedingAction, 'jetpack-my-jetpack' )
							),
							{
								link: (
									<ExternalLink
										href={ getRedirectUrl( 'jetpack-subscription-renew', {
											site: siteSuffix,
											path: planPurchase.ID,
										} ) }
									/>
								),
							}
						) }
					</Text>
					<ul className="plugins-list">
						{ pluginsList.map( ( pluginInfo, index ) => (
							<li key={ index } className="plugin-item">
								{ actionVerb === 'activate' ? (
									<a href="/wp-admin/plugins.php">{ pluginInfo.pluginName }</a>
								) : (
									<ExternalLink href={ pluginInfo.pluginUri }>
										{ pluginInfo.pluginName }
									</ExternalLink>
								) }
								<span>(Needs { actionNoun })</span>
							</li>
						) ) }
					</ul>
				</Col>
			</>
		);

		const buttonLabel = sprintf(
			/* translators: %1$s is either "Install and activate", or "Install and/or activate", or "Activate"; And %2$s is "plugin" or "plugins" (singular/plural). */
			__( '%1$s %2$s in one click', 'jetpack-my-jetpack' ),
			actionVerb.charAt( 0 ).toUpperCase() + actionVerb.slice( 1 ),
			_n( 'plugin', 'plugins', numPluginsNeedingAction, 'jetpack-my-jetpack' )
		);

		const isinstallingOrActivating = isActivating || isInstalling;

		const noticeOptions: NoticeOptions = {
			id: 'plugin_needs_installed_activated',
			level: 'warning',
			actions: [
				{
					label: buttonLabel,
					onClick: handleInstallActivateInOneClick,
					isLoading: isinstallingOrActivating,
					loadingText:
						actionVerb === 'activate'
							? sprintf(
									/* translators: %s is the singular or plural "plugin" or "plugins". */
									__( 'Activating %s…', 'jetpack-my-jetpack' ),
									_n( 'plugin', 'plugins', numPluginsNeedingAction, 'jetpack-my-jetpack' )
							  )
							: sprintf(
									/* translators: %s is the singular or plural "plugin" or "plugins". */
									__( 'Installing and activating %s…', 'jetpack-my-jetpack' ),
									_n( 'plugin', 'plugins', numPluginsNeedingAction, 'jetpack-my-jetpack' )
							  ),
					noDefaultClasses: true,
				},
			],
			priority: NOTICE_PRIORITY_MEDIUM + ( isinstallingOrActivating ? 1 : 0 ),
		};

		setNotice( {
			title: noticeTitle,
			message: noticeMessage,
			options: noticeOptions,
		} );
	}, [
		actionNoun,
		actionVerb,
		isPurchasesDataLoaded,
		numPluginsNeedingAction,
		handleInstallActivateInOneClick,
		planName,
		planPurchase,
		pluginsList,
		pluginsNeedingActionAlerts.length,
		setNotice,
		siteSuffix,
		isInstalling,
		isActivating,
	] );
};

export default usePaidPlanNeedsPluginInstallActivationNotice;
