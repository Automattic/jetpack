/**
 * WordPress dependencies
 */
import { ComboboxControl } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Types
 */
import type { Playlist } from '../../../../../dashboard/types/playlist';
import type { ReactNode } from 'react';

type PlaylistPickerProps = {
	playlists: Playlist[];
	value?: number;
	onChange: ( playlistId?: number ) => void;
};

/**
 * Combobox picker over the site's VideoPress playlists.
 *
 * Shared between the block placeholder (empty state) and the inspector
 * sidebar, so switching playlists after the initial pick uses the same
 * control.
 *
 * @param {PlaylistPickerProps} props           - Component props.
 * @param {Array}               props.playlists - The playlists to pick from.
 * @param {number}              props.value     - The selected playlist term ID.
 * @param {Function}            props.onChange  - Called with the new term ID (or undefined when cleared).
 * @return {ReactNode} The playlist picker control.
 */
export default function PlaylistPicker( {
	playlists,
	value,
	onChange,
}: PlaylistPickerProps ): ReactNode {
	const options = useMemo(
		() =>
			playlists.map( playlist => ( {
				value: String( playlist.id ),
				label:
					playlist.name !== ''
						? playlist.name
						: sprintf(
								/* translators: %d: the playlist ID. */
								__( 'Playlist #%d', 'jetpack-videopress-pkg' ),
								playlist.id
						  ),
			} ) ),
		[ playlists ]
	);

	return (
		<ComboboxControl
			label={ __( 'Playlist', 'jetpack-videopress-pkg' ) }
			value={ value ? String( value ) : '' }
			options={ options }
			onChange={ next => onChange( next ? Number( next ) : undefined ) }
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		/>
	);
}
