/**
 * PluginList screen — shows all managed plugins with their active branch/version
 * and a "Manage" link, plus the global settings toggles.
 *
 * @package
 */

import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, chevronRight, plugins as pluginsIcon } from '@wordpress/icons';
import { Badge, Card, Notice, Stack, Text } from '@wordpress/ui';
import { errorMessage, listPlugins } from '../api/abilities';
import GlobalToggles from '../components/global-toggles';
import { CardRowSkeleton } from '../components/skeleton';
import type { PluginListItem } from '../api/types';
import type { KeyboardEvent } from 'react';

/**
 * Derive the display version string and badge label for a plugin row.
 *
 * @param plugin - The plugin list item.
 * @return Version text and optional badge label.
 */
const pluginStatus = (
	plugin: PluginListItem
): { versionText: string; badgeLabel: string | null } => {
	if ( plugin.active_which === 'dev' ) {
		return {
			versionText: plugin.active_version ?? '',
			badgeLabel: __( 'Dev', 'jetpack-beta' ),
		};
	}
	if ( plugin.active_which === 'stable' ) {
		return {
			versionText: plugin.active_version ?? '',
			badgeLabel: __( 'Stable', 'jetpack-beta' ),
		};
	}
	return {
		versionText: __( 'Plugin is not active', 'jetpack-beta' ),
		badgeLabel: null,
	};
};

/**
 * A single clickable plugin card. The whole card navigates to the plugin's
 * manage screen; the chevron is a visual affordance only.
 *
 * @param props        - Component props.
 * @param props.plugin - The plugin to render.
 * @return The plugin card element.
 */
const PluginCard = ( { plugin }: { plugin: PluginListItem } ) => {
	const { versionText, badgeLabel } = pluginStatus( plugin );
	// Plugins without wordpress.org assets (unpublished betas) fall back to a
	// generic plugin icon so every row stays visually aligned.
	const [ iconFailed, setIconFailed ] = useState( false );

	const onIconError = useCallback( () => {
		setIconFailed( true );
	}, [] );

	const goToManage = useCallback( () => {
		window.location.href = plugin.manage_url;
	}, [ plugin.manage_url ] );

	const onKeyDown = useCallback(
		( event: KeyboardEvent ) => {
			if ( event.key === 'Enter' || event.key === ' ' ) {
				event.preventDefault();
				goToManage();
			}
		},
		[ goToManage ]
	);

	return (
		<Card.Root
			className="jetpack-beta-plugin-card"
			role="button"
			tabIndex={ 0 }
			aria-label={ sprintf(
				/* translators: %s: plugin name. */
				__( 'Manage %s', 'jetpack-beta' ),
				plugin.name
			) }
			onClick={ goToManage }
			onKeyDown={ onKeyDown }
		>
			<Card.Content>
				<Stack direction="row" align="center" justify="space-between">
					<Stack direction="row" gap="md" align="center">
						{ iconFailed ? (
							<span
								className="jetpack-beta-plugin-icon jetpack-beta-plugin-icon--fallback"
								aria-hidden="true"
							>
								<Icon icon={ pluginsIcon } size={ 24 } />
							</span>
						) : (
							<img
								className="jetpack-beta-plugin-icon"
								src={ `https://ps.w.org/${ plugin.slug }/assets/icon.svg` }
								alt=""
								aria-hidden="true"
								onError={ onIconError }
							/>
						) }
						<Stack direction="column" gap="xs">
							<Text variant="body-md">{ plugin.name }</Text>
							<Stack direction="row" gap="xs" align="center">
								<Text variant="body-sm">{ versionText }</Text>
								{ badgeLabel && (
									<Badge intent={ plugin.active_which === 'dev' ? 'informational' : 'stable' }>
										{ badgeLabel }
									</Badge>
								) }
							</Stack>
						</Stack>
					</Stack>
					<Icon icon={ chevronRight } size={ 24 } />
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

const boot = window.JetpackBeta;
const CACHE_KEY = 'jetpack-beta-plugins';

/**
 * Read the remembered plugin list from localStorage.
 *
 * @return The cached plugin list, or null when absent/unreadable.
 */
const readCachedPlugins = (): PluginListItem[] | null => {
	try {
		const raw = window.localStorage.getItem( CACHE_KEY );
		return raw ? ( JSON.parse( raw ) as PluginListItem[] ) : null;
	} catch {
		return null;
	}
};

/**
 * Remember the plugin list in localStorage for instant subsequent loads.
 *
 * @param plugins - The plugin list to cache.
 */
const writeCachedPlugins = ( plugins: PluginListItem[] ) => {
	try {
		window.localStorage.setItem( CACHE_KEY, JSON.stringify( plugins ) );
	} catch {
		// Ignore storage failures (private mode, quota) — the list still renders.
	}
};

/**
 * PluginList screen component.
 *
 * Renders a card per managed plugin alongside the GlobalToggles settings panel.
 * The list is preloaded from the page bootstrap (or a localStorage cache) so it
 * paints instantly; it only falls back to the list-plugins ability when neither
 * is available. The list rarely changes, so a preloaded/cached list is not
 * re-fetched.
 *
 * @return The plugin list screen element.
 */
const PluginList = () => {
	const preloaded = boot.plugins ?? readCachedPlugins();
	const [ plugins, setPlugins ] = useState< PluginListItem[] | null >( preloaded );
	const [ loading, setLoading ] = useState( preloaded === null );
	const [ error, setError ] = useState< string | null >( null );

	useEffect( () => {
		// Remember the freshest list (the bootstrap preload) for next time.
		if ( boot.plugins ) {
			writeCachedPlugins( boot.plugins );
		}

		// Already have a list (preloaded or remembered) — skip the fetch.
		if ( preloaded !== null ) {
			return;
		}

		let cancelled = false;
		listPlugins()
			.then( data => {
				if ( ! cancelled ) {
					setPlugins( data.plugins );
					writeCachedPlugins( data.plugins );
					setLoading( false );
				}
			} )
			.catch( ( err: unknown ) => {
				if ( ! cancelled ) {
					setError( errorMessage( err, __( 'Could not load plugins.', 'jetpack-beta' ) ) );
					setLoading( false );
				}
			} );
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- one-time mount effect; `preloaded`/`boot` are stable for the life of the page
	}, [] );

	return (
		// Full-width scroll container so the scrollbar sits at the page edge; the
		// inner content div keeps everything at a centered, responsive fixed width.
		<div className="jetpack-beta-scroll">
			<div className="jetpack-beta-content">
				<Stack direction="column" gap="md">
					<GlobalToggles />
					{ loading &&
						Array.from( { length: 6 } ).map( ( _, index ) => <CardRowSkeleton key={ index } /> ) }
					{ error && (
						<Notice.Root intent="error">
							<Notice.Description>{ error }</Notice.Description>
						</Notice.Root>
					) }
					{ plugins &&
						plugins.map( plugin => <PluginCard key={ plugin.slug } plugin={ plugin } /> ) }
				</Stack>
			</div>
		</div>
	);
};

export default PluginList;
