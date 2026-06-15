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
import { ListSkeleton } from '../components/skeleton';
import UpdatesPanel from '../components/updates-panel';
import Welcome from '../components/welcome';
import type { PluginListItem } from '../api/types';

/**
 * Derive the display version string and badge label for a plugin row.
 *
 * @param plugin - The plugin list item.
 * @return Version text and optional badge label.
 */
const pluginStatus = (
	plugin: PluginListItem
): { versionText: string; versionDetail: string | null; badgeLabel: string | null } => {
	if ( plugin.active_which === 'dev' ) {
		return {
			versionText: plugin.active_version ?? '',
			// The pretty version is just a channel label ("Bleeding Edge" etc.), so
			// show the concrete running version too — matching the manage screen.
			versionDetail: plugin.active_version_detail ?? null,
			badgeLabel: __( 'Dev', 'jetpack-beta' ),
		};
	}
	if ( plugin.active_which === 'stable' ) {
		return {
			versionText: plugin.active_version ?? '',
			versionDetail: null,
			badgeLabel: __( 'Stable', 'jetpack-beta' ),
		};
	}
	return {
		versionText: __( 'Plugin is not active', 'jetpack-beta' ),
		versionDetail: null,
		badgeLabel: null,
	};
};

/**
 * A single plugin row inside the ItemGroup list. The whole row is a link to the
 * plugin's manage screen (so it behaves like a real link — middle/cmd-click,
 * copy URL, etc.); the chevron is a visual affordance only.
 *
 * @param props        - Component props.
 * @param props.plugin - The plugin to render.
 * @return The plugin row element.
 */
const PluginCard = ( { plugin }: { plugin: PluginListItem } ) => {
	const { versionText, versionDetail, badgeLabel } = pluginStatus( plugin );
	// Plugins without wordpress.org assets (unpublished betas) fall back to a
	// generic plugin icon so every row stays visually aligned.
	const [ iconFailed, setIconFailed ] = useState( false );

	const onIconError = useCallback( () => {
		setIconFailed( true );
	}, [] );

	return (
		<a
			className="jetpack-beta-list-row jetpack-beta-plugin-row"
			href={ plugin.manage_url }
			aria-label={ sprintf(
				/* translators: %s: plugin name. */
				__( 'Manage %s', 'jetpack-beta' ),
				plugin.name
			) }
		>
			<Stack
				className="jetpack-beta-plugin-row__inner"
				direction="row"
				align="center"
				justify="space-between"
			>
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
						{ versionDetail && <Text variant="body-sm">{ versionDetail }</Text> }
					</Stack>
				</Stack>
				<Icon icon={ chevronRight } size={ 24 } />
			</Stack>
		</a>
	);
};

const boot = window.JetpackBeta;

/**
 * PluginList screen component.
 *
 * Renders a card per managed plugin alongside the GlobalToggles settings panel.
 * The list is preloaded from the page bootstrap (`window.JetpackBeta.plugins`,
 * cached data the server localizes on each load) so it paints instantly, then
 * revalidates against the (cache-bypassing) list-plugins ability and reconciles
 * — stale-while-revalidate, with the server bootstrap as the cache.
 *
 * @return The plugin list screen element.
 */
const PluginList = () => {
	const [ plugins, setPlugins ] = useState< PluginListItem[] | null >( boot.plugins );
	const [ loading, setLoading ] = useState( boot.plugins === null );
	const [ error, setError ] = useState< string | null >( null );

	useEffect( () => {
		// Revalidate against fresh server data; the bootstrap preload keeps painting
		// instantly in the meantime.
		let cancelled = false;
		listPlugins()
			.then( data => {
				if ( ! cancelled ) {
					setPlugins( data.plugins );
					setLoading( false );
				}
			} )
			.catch( ( err: unknown ) => {
				if ( ! cancelled ) {
					// Only surface an error when there's nothing to show; otherwise
					// keep the bootstrap preload rather than replacing it.
					if ( boot.plugins === null ) {
						setError( errorMessage( err, __( 'Could not load plugins.', 'jetpack-beta' ) ) );
					}
					setLoading( false );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [] );

	return (
		// Full-width scroll container so the scrollbar sits at the page edge; the
		// inner content div keeps everything at a centered, responsive fixed width.
		<div className="jetpack-beta-scroll">
			<div className="jetpack-beta-content">
				<Stack direction="column" gap="md">
					<Welcome />
					<GlobalToggles />
					<UpdatesPanel />
					{ loading && <ListSkeleton rows={ 6 } /> }
					{ error && (
						<Notice.Root intent="error">
							<Notice.Description>{ error }</Notice.Description>
						</Notice.Root>
					) }
					{ plugins && plugins.length > 0 && (
						<Card.Root className="jetpack-beta-list">
							{ plugins.map( plugin => (
								<PluginCard key={ plugin.slug } plugin={ plugin } />
							) ) }
						</Card.Root>
					) }
				</Stack>
			</div>
		</div>
	);
};

export default PluginList;
