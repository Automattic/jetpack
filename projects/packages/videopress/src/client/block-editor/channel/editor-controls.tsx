/**
 * WordPress dependencies
 */
import { SelectControl, TextControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

type ChannelEditorData = {
	playlists?: Array< { key: string; title: string } >;
};

declare global {
	interface Window {
		videopressChannelEditor?: ChannelEditorData;
	}
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
