/**
 * PluginList screen — shows all managed plugins with their active branch/version
 * and a "Manage" link, plus the global settings toggles.
 *
 * @package
 */

import { Spinner } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge, Button, Card, Notice, Stack, Text } from '@wordpress/ui';
import { listPlugins } from '../api/abilities';
import GlobalToggles from '../components/global-toggles';
import type { PluginListItem } from '../api/types';

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
 * PluginList screen component.
 *
 * Fetches all managed plugins on mount and renders a card per plugin alongside
 * the GlobalToggles settings panel.
 *
 * @return The plugin list screen element.
 */
const PluginList = () => {
	const [ plugins, setPlugins ] = useState< PluginListItem[] | null >( null );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );

	useEffect( () => {
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
					const msg =
						err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
							? err.message
							: __( 'Could not load plugins.', 'jetpack-beta' );
					setError( msg );
					setLoading( false );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [] );

	return (
		<Stack direction="column" gap="md">
			<GlobalToggles />
			{ loading && <Spinner /> }
			{ error && (
				<Notice.Root intent="error">
					<Notice.Description>{ error }</Notice.Description>
				</Notice.Root>
			) }
			{ plugins &&
				plugins.map( plugin => {
					const { versionText, badgeLabel } = pluginStatus( plugin );
					return (
						<Card.Root key={ plugin.slug }>
							<Card.Content>
								<Stack direction="row" align="center" justify="space-between">
									<Stack direction="column" gap="xs">
										<Card.Title>
											<Text variant="body-md">{ plugin.name }</Text>
										</Card.Title>
										<Stack direction="row" gap="xs" align="center">
											<Text variant="body-sm">{ versionText }</Text>
											{ badgeLabel && (
												<Badge
													intent={ plugin.active_which === 'dev' ? 'informational' : 'stable' }
												>
													{ badgeLabel }
												</Badge>
											) }
										</Stack>
									</Stack>
									<Button
										variant="outline"
										tone="neutral"
										size="compact"
										nativeButton={ false }
										render={ <a href={ plugin.manage_url } /> }
									>
										{ __( 'Manage', 'jetpack-beta' ) }
									</Button>
								</Stack>
							</Card.Content>
						</Card.Root>
					);
				} ) }
		</Stack>
	);
};

export default PluginList;
