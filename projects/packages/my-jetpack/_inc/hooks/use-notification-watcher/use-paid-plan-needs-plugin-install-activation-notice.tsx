import { Col, Text } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
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
import { useGetPaidPlanNeedsPluginsContent } from './get-paid-plan-needs-plugins-content';
import type { NoticeOptions } from '../../context/notices/types';
import type { MyJetpackInitialState } from '../../data/types';

type RedBubbleAlerts = MyJetpackInitialState[ 'redBubbleAlerts' ];
type Purchase = MyJetpackInitialState[ 'purchases' ][ 'items' ][ 0 ];

// The notice will not show again for 14 days (when clicking the close(X) button).
const NUM_DAYS_COOKIE_EXPIRES = 14;

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
		products: { items: products },
	} = getMyJetpackWindowInitialState();

	const actionType = useMemo( () => {
		if ( needs_installed && needs_activated_only ) {
			return 'install_activate';
		} else if ( needs_installed ) {
			return 'install';
		}
		return 'activate';
	}, [ needs_activated_only, needs_installed ] );

	const getPluginInfo = useCallback(
		( productSlug, action ) => ( {
			productSlug: productSlug,
			pluginSlug: products[ productSlug ].plugin_slug,
			pluginName:
				products[ productSlug ].plugin_slug === 'jetpack'
					? 'Jetpack'
					: products[ productSlug ].title,
			action,
			pluginUri: `https://wordpress.org/plugins/${ products[ productSlug ].plugin_slug }/`,
		} ),
		[ products ]
	);

	const pluginsList = useMemo( () => {
		if ( needs_installed && needs_activated_only ) {
			const slugs = new Set();
			const needsInstalled = [ ...needs_installed ].map( productSlug =>
				getPluginInfo( productSlug, 'install' )
			);
			const needsActivated = [ ...needs_activated_only ].map( productSlug =>
				getPluginInfo( productSlug, 'activate' )
			);
			return [ ...needsInstalled, ...needsActivated ].filter(
				/* filters out duplicates */
				( { pluginSlug } ) => ! slugs.has( pluginSlug ) && slugs.add( pluginSlug )
			);
		} else if ( needs_installed ) {
			const slugs = new Set();
			return (
				needs_installed
					.map( productSlug => getPluginInfo( productSlug, 'install' ) )
					/* filters out duplicates */
					.filter( ( { pluginSlug } ) => ! slugs.has( pluginSlug ) && slugs.add( pluginSlug ) )
			);
		}
		const slugs = new Set();
		return (
			needs_activated_only
				?.map( productSlug => getPluginInfo( productSlug, 'activate' ) )
				/* filters out duplicates */
				.filter( ( { pluginSlug } ) => ! slugs.has( pluginSlug ) && slugs.add( pluginSlug ) )
		);
	}, [ getPluginInfo, needs_activated_only, needs_installed ] );

	const { noticeTitle, noticeMessage, buttonLabel } = useGetPaidPlanNeedsPluginsContent( {
		alert,
		planName,
		planPurchaseId: planPurchase?.ID,
	} );

	const prepareProductsArray = useCallback(
		productsArray => {
			if ( ! productsArray ) {
				return [];
			}
			const prepared = [ ...productsArray ]
				.map( productSlug => ( { productSlug, pluginSlug: products[ productSlug ].plugin_slug } ) )
				.sort( ( a, b ) => {
					if ( a.pluginSlug === 'jetpack' ) {
						return 1; // Move `jetpack` to the end
					} else if ( b.pluginSlug === 'jetpack' ) {
						return -1; // Keep others before `jetpack`
					}
					return a.productSlug - b.productSlug; // Otherwise sort ascending
				} )
				.map( ( { productSlug } ) => productSlug );
			return prepared;
		},
		[ products ]
	);

	const needsInstalled = prepareProductsArray( needs_installed );
	const needsActivated = prepareProductsArray( needs_activated_only );

	const needsInstalledContainsJetpack = needsInstalled.find(
		productSlug => products[ productSlug ].plugin_slug === 'jetpack'
	);

	const onCloseClick = useCallback( () => {
		const expireDate = new Date( Date.now() + 1000 * 3600 * 24 * NUM_DAYS_COOKIE_EXPIRES );
		document.cookie = `${ planSlug }--plugins_needing_installed_dismissed=1; expires=${ expireDate.toString() }; SameSite=None; Secure`;
		delete redBubbleAlerts[ pluginsNeedingActionAlerts[ 0 ] ];
		resetNotice();
	}, [ planSlug, pluginsNeedingActionAlerts, redBubbleAlerts, resetNotice ] );

	const { install: installAndActivatePlugins, isPending: isInstalling } =
		useInstallPlugins( needsInstalled );
	const { activate: activatePlugins, isPending: isActivating } =
		useActivatePlugins( needsActivated );

	const handleInstallActivateInOneClick = useCallback( () => {
		recordEvent( 'jetpack_my_jetpack_plugin_needs_installed_notice_cta_click' );

		if ( needsInstalled.length && needsActivated.length ) {
			if ( needsInstalledContainsJetpack ) {
				activatePlugins( null, {
					onSuccess: () => {
						installAndActivatePlugins( null, {
							onSuccess: () => {
								delete redBubbleAlerts[ pluginsNeedingActionAlerts[ 0 ] ];
								resetNotice();
							},
						} );
					},
				} );
				return;
			}
			installAndActivatePlugins( null, {
				onSuccess: () => {
					activatePlugins( null, {
						onSuccess: () => {
							delete redBubbleAlerts[ pluginsNeedingActionAlerts[ 0 ] ];
							resetNotice();
						},
					} );
				},
			} );
			return;
		}

		if ( needsInstalled.length ) {
			installAndActivatePlugins( null, {
				onSuccess: () => {
					delete redBubbleAlerts[ pluginsNeedingActionAlerts[ 0 ] ];
					resetNotice();
				},
			} );
			return;
		}
		if ( needsActivated.length ) {
			activatePlugins( null, {
				onSuccess: () => {
					delete redBubbleAlerts[ pluginsNeedingActionAlerts[ 0 ] ];
					resetNotice();
				},
			} );
		}
	}, [
		recordEvent,
		needsInstalled,
		needsActivated,
		needsInstalledContainsJetpack,
		installAndActivatePlugins,
		activatePlugins,
		redBubbleAlerts,
		pluginsNeedingActionAlerts,
		resetNotice,
	] );

	useEffect( () => {
		if ( pluginsNeedingActionAlerts.length === 0 || ! isPurchasesDataLoaded ) {
			return;
		}

		const actionNounMap = {
			install: __( 'Needs installation and activation', 'jetpack-my-jetpack' ),
			activate: __( 'Needs activation', 'jetpack-my-jetpack' ),
		};

		const noticeContent = (
			<>
				<Col>
					<Text mt={ 2 } mb={ 2 }>
						{ noticeMessage }
					</Text>
					<ul className="plugins-list">
						{ pluginsList.map( ( pluginInfo, index ) => {
							return (
								<li key={ index } className="plugin-item">
									{ pluginInfo.action === 'activate' ? (
										<a href="/wp-admin/plugins.php">{ pluginInfo.pluginName }</a>
									) : (
										<ExternalLink href={ pluginInfo.pluginUri }>
											{ pluginInfo.pluginName }
										</ExternalLink>
									) }
									<span>({ actionNounMap[ pluginInfo.action ] })</span>
								</li>
							);
						} ) }
					</ul>
				</Col>
			</>
		);

		const isInstallingOrActivating = isActivating || isInstalling;

		const noticeOptions: NoticeOptions = {
			id: 'plugin_needs_installed_activated',
			level: 'warning',
			actions: [
				{
					label: buttonLabel,
					onClick: handleInstallActivateInOneClick,
					isLoading: isInstallingOrActivating,
					loadingText:
						actionType === 'activate'
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
			onClose: onCloseClick,
			hideCloseButton: false,
			priority: NOTICE_PRIORITY_MEDIUM + ( isInstallingOrActivating ? 1 : 0 ),
		};

		setNotice( {
			title: noticeTitle,
			message: noticeContent,
			options: noticeOptions,
		} );
	}, [
		actionType,
		noticeTitle,
		noticeMessage,
		buttonLabel,
		isPurchasesDataLoaded,
		numPluginsNeedingAction,
		onCloseClick,
		handleInstallActivateInOneClick,
		planName,
		planPurchase,
		pluginsList,
		pluginsNeedingActionAlerts.length,
		setNotice,
		isInstalling,
		isActivating,
	] );
};

export default usePaidPlanNeedsPluginInstallActivationNotice;
