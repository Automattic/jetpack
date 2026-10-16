/**
 * WordPress dependencies
 */
import { SelectControl, TextControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Types
 */
import type { PlaylistEntry } from '../blocks/playlist/types';

export type ChannelPlaylist = {
	key: string;
	title: string;
	videos?: PlaylistEntry[];
};

type ChannelEditorData = {
	// The site's published playlists, most recently updated first.
	playlists?: ChannelPlaylist[];
};

declare global {
	interface Window {
		videopressChannelEditor?: ChannelEditorData;
	}
}

/**
 * The playlist a block with the `index` source shows, as the server resolves it: the one with the
 * key, or the most recently updated one when no key is set.
 *
 * @param key - Selected playlist key; empty for the most recently updated.
 * @return The playlist; null when there is no such playlist; undefined when the editor was not given the list.
 */
export function editorSourcePlaylist( key = '' ): ChannelPlaylist | null | undefined {
	const playlists = window.videopressChannelEditor?.playlists;
	if ( ! Array.isArray( playlists ) ) {
		return undefined;
	}
	return ( key ? playlists.find( playlist => playlist.key === key ) : playlists[ 0 ] ) ?? null;
}

type PlaylistPickerProps = {
	value?: string;
	onChange: ( value: string ) => void;
};

/**
 * Pick one of the site's playlists, or the most recently updated one. Falls back to typing the
 * playlist ID when the editor was not given the list.
 *
 * @param props          - Component props.
 * @param props.value    - Selected playlist key; empty for the most recently updated.
 * @param props.onChange - Key setter.
 * @return The control.
 */
export function PlaylistPicker( { value = '', onChange }: PlaylistPickerProps ) {
	const playlists = window.videopressChannelEditor?.playlists;

	if ( ! Array.isArray( playlists ) ) {
		return (
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Playlist ID', 'jetpack-videopress-pkg' ) }
				help={ __(
					'Leave empty for the most recently updated playlist.',
					'jetpack-videopress-pkg'
				) }
				value={ value }
				onChange={ onChange }
			/>
		);
	}

	const options = [
		{ value: '', label: __( 'Most recently updated', 'jetpack-videopress-pkg' ) },
		...playlists.map( playlist => ( {
			value: playlist.key,
			label: playlist.title || __( 'Untitled playlist', 'jetpack-videopress-pkg' ),
		} ) ),
	];
	if ( value && ! playlists.some( playlist => playlist.key === value ) ) {
		options.push( {
			value,
			/* translators: %s: playlist ID that no longer matches a published playlist. */
			label: sprintf( __( 'Missing playlist (%s)', 'jetpack-videopress-pkg' ), value ),
		} );
	}

	return (
		<SelectControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ __( 'Playlist', 'jetpack-videopress-pkg' ) }
			value={ value }
			options={ options }
			onChange={ onChange }
		/>
	);
}
