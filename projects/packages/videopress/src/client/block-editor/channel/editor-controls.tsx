/**
 * WordPress dependencies
 */
import { SelectControl, TextControl } from '@wordpress/components';
import { __, _x, sprintf } from '@wordpress/i18n';
/**
 * Types
 */
import type { PlaylistEntry } from '../blocks/playlist/types';

export type ChannelPlaylist = {
	key: string;
	title: string;
	videos?: PlaylistEntry[];
};

export type EmptyStateMode = 'none' | 'author' | 'all';

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

type EmptyStateControlProps = {
	value?: EmptyStateMode;
	onChange: ( value: EmptyStateMode ) => void;
	// What the empty state asks for: uploading videos or creating playlists.
	kind: 'videos' | 'playlists';
};

/**
 * Choose what the block shows while the channel has no videos or no playlists.
 *
 * @param props          - Component props.
 * @param props.value    - Current mode.
 * @param props.onChange - Mode setter.
 * @param props.kind     - What is missing.
 * @return The control.
 */
export function EmptyStateControl( { value, onChange, kind }: EmptyStateControlProps ) {
	return (
		<SelectControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={
				'videos' === kind
					? __( 'When there are no videos', 'jetpack-videopress-pkg' )
					: _x( 'When there are no playlists', '', 'jetpack-videopress-pkg' )
			}
			value={ value ?? 'none' }
			options={ [
				{ value: 'none', label: __( 'Show nothing', 'jetpack-videopress-pkg' ) },
				{
					value: 'author',
					label: __( 'Prompt the site’s authors', 'jetpack-videopress-pkg' ),
				},
				{
					value: 'all',
					label: __( 'Prompt authors, tell visitors', 'jetpack-videopress-pkg' ),
				},
			] }
			onChange={ mode => onChange( mode as EmptyStateMode ) }
		/>
	);
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
