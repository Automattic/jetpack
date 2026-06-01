/**
 * UpdatesPanel — lists managed plugins that have a newer build available and
 * lets the user update each one in place.
 *
 * Renders nothing when there are no updates. Optionally scoped to a single
 * plugin via `slug` (used on the manage screen).
 *
 * @package
 */

import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Badge, Button, Card, Notice, Stack, Text } from '@wordpress/ui';
import { errorMessage, listUpdates, updatePlugin } from '../api/abilities';
import type { PluginUpdate } from '../api/types';

type RowProps = {
	update: PluginUpdate;
	busy: boolean;
	disabled: boolean;
	onUpdate: ( pluginFile: string ) => void;
};

/**
 * A single "update available" row with its Update button.
 *
 * @param {RowProps} props - Component props.
 * @return The row element.
 */
const UpdateRow = ( { update, busy, disabled, onUpdate }: RowProps ) => {
	const handle = useCallback(
		() => onUpdate( update.plugin_file ),
		[ onUpdate, update.plugin_file ]
	);

	return (
		<Stack direction="row" align="center" justify="space-between">
			<Stack direction="column" gap="xs">
				<Text variant="body-md">{ update.name }</Text>
				<Text variant="body-sm">
					{ sprintf(
						/* translators: %s: version number. */
						__( 'Version %s is available', 'jetpack-beta' ),
						update.new_version
					) }
				</Text>
			</Stack>
			<Button
				variant="primary"
				size="compact"
				disabled={ disabled }
				loading={ busy }
				loadingAnnouncement={ __( 'Updating…', 'jetpack-beta' ) }
				onClick={ handle }
			>
				{ busy ? __( 'Updating…', 'jetpack-beta' ) : __( 'Update', 'jetpack-beta' ) }
			</Button>
		</Stack>
	);
};

type Props = {
	slug?: string;
	onUpdated?: () => void;
};

/**
 * Updates-available panel.
 *
 * @param {Props} props - Component props.
 * @return The panel element, or null when there are no updates.
 */
const UpdatesPanel = ( { slug, onUpdated }: Props ) => {
	const [ updates, setUpdates ] = useState< PluginUpdate[] | null >( null );
	const [ error, setError ] = useState< string | null >( null );
	const [ busyFile, setBusyFile ] = useState< string | null >( null );

	useEffect( () => {
		let cancelled = false;
		listUpdates( slug )
			.then( data => {
				if ( ! cancelled ) {
					setUpdates( data.updates );
				}
			} )
			.catch( ( err: unknown ) => {
				if ( ! cancelled ) {
					setError( errorMessage( err, __( 'Could not check for updates.', 'jetpack-beta' ) ) );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [ slug ] );

	const handleUpdate = useCallback(
		( pluginFile: string ) => {
			if ( busyFile !== null ) {
				return;
			}
			setBusyFile( pluginFile );
			setError( null );
			updatePlugin( pluginFile )
				.then( data => {
					setUpdates( data.updates );
					onUpdated?.();
				} )
				.catch( ( err: unknown ) => {
					setError( errorMessage( err, __( 'Could not update the plugin.', 'jetpack-beta' ) ) );
				} )
				.finally( () => {
					setBusyFile( null );
				} );
		},
		[ busyFile, onUpdated ]
	);

	// Render nothing until we know there is at least one update to offer.
	if ( ! error && ( ! updates || updates.length === 0 ) ) {
		return null;
	}

	return (
		<Card.Root>
			<Card.Content>
				<Stack direction="column" gap="md">
					<Stack direction="row" gap="xs" align="center">
						<Text variant="heading-sm">{ __( 'Updates available', 'jetpack-beta' ) }</Text>
						{ updates && updates.length > 0 && (
							<Badge intent="informational">{ String( updates.length ) }</Badge>
						) }
					</Stack>
					{ error && (
						<Notice.Root intent="error">
							<Notice.Description>{ error }</Notice.Description>
						</Notice.Root>
					) }
					{ updates?.map( update => (
						<UpdateRow
							key={ update.plugin_file }
							update={ update }
							busy={ busyFile === update.plugin_file }
							disabled={ busyFile !== null }
							onUpdate={ handleUpdate }
						/>
					) ) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

export default UpdatesPanel;
