/**
 * PluginList screen — shows all managed plugins with their active branch/version
 * and a "Manage" link, plus the global settings toggles.
 *
 * @package
 */

import { Col, Container } from '@automattic/jetpack-components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, chevronRight } from '@wordpress/icons';
import { Badge, Card, Notice, Stack, Text } from '@wordpress/ui';
import { listPlugins } from '../api/abilities';
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
					<Icon icon={ chevronRight } size={ 24 } />
				</Stack>
			</Card.Content>
		</Card.Root>
	);
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
		<Container horizontalSpacing={ 5 } horizontalGap={ 3 }>
			<Col>
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
			</Col>
		</Container>
	);
};

export default PluginList;
