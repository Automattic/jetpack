/**
 * UpdatesPanel — surfaces managed plugins that have a newer build available and
 * lets the user update each one in place.
 *
 * Each pending update is shown as a non-dismissable warning (orange) Notice so
 * it clearly stands out. Renders nothing when there are no updates. Optionally
 * scoped to a single plugin via `slug` (used on the manage screen).
 *
 * @package
 */

import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Notice, Stack } from '@wordpress/ui';
import { errorMessage, listUpdates, updatePlugin } from '../api/abilities';
import type { PluginUpdate } from '../api/types';

type RowProps = {
	update: PluginUpdate;
	busy: boolean;
	disabled: boolean;
	onUpdate: ( pluginFile: string ) => void;
};

/**
 * A single pending-update notice with its Update action.
 *
 * @param {RowProps} props - Component props.
 * @return The notice element.
 */
const UpdateRow = ( { update, busy, disabled, onUpdate }: RowProps ) => {
	const handle = useCallback(
		() => onUpdate( update.plugin_file ),
		[ onUpdate, update.plugin_file ]
	);

	return (
		<Notice.Root intent="warning">
			<Notice.Title>{ update.name }</Notice.Title>
			<Notice.Description>
				{ sprintf(
					/* translators: %s: version number. */
					__( 'Version %s is available', 'jetpack-beta' ),
					update.new_version
				) }
			</Notice.Description>
			<Notice.Actions>
				<Notice.ActionButton
					disabled={ disabled }
					loading={ busy }
					loadingAnnouncement={ __( 'Updating…', 'jetpack-beta' ) }
					onClick={ handle }
				>
					{ busy ? __( 'Updating…', 'jetpack-beta' ) : __( 'Update', 'jetpack-beta' ) }
				</Notice.ActionButton>
			</Notice.Actions>
		</Notice.Root>
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
		<Stack direction="column" gap="md">
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
	);
};

export default UpdatesPanel;
