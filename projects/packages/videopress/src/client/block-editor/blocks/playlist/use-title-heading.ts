/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef } from '@wordpress/element';
import { escapeHTML } from '@wordpress/escape-html';
import { __ } from '@wordpress/i18n';
/**
 * Types
 */
import type { PlaylistAttributes } from './types';

type HeadingTemplate = Array< [ string, Record< string, unknown > ] >;

type UseTitleHeadingArgs = {
	clientId: string;
	playlistTitle: string;
	showPlaylistTitle: boolean;
	setAttributes: ( attributes: Partial< PlaylistAttributes > ) => void;
};

/**
 * The plain text of a heading's rich-text content.
 *
 * @param content - Heading content: an HTML string or a RichTextData instance.
 * @return The text, with markup dropped and entities decoded.
 */
export function headingText( content: unknown ): string {
	const html = String( content ?? '' );
	if ( ! html.includes( '<' ) && ! html.includes( '&' ) ) {
		return html;
	}
	return new window.DOMParser().parseFromString( html, 'text/html' ).body.textContent ?? '';
}

/**
 * Keep the playlist title and its Heading inner block in step.
 *
 * The heading exists while the title is shown, and edits in either place
 * (the heading in the canvas, the Title field in the sidebar) update both.
 *
 * @param args                   - Hook arguments.
 * @param args.clientId          - The playlist block's client id.
 * @param args.playlistTitle     - Current title attribute.
 * @param args.showPlaylistTitle - Whether the heading is shown.
 * @param args.setAttributes     - The playlist block's attribute setter.
 * @return The inner blocks template, and a title setter for the sidebar.
 */
export default function useTitleHeading( {
	clientId,
	playlistTitle,
	showPlaylistTitle,
	setAttributes,
}: UseTitleHeadingArgs ) {
	// The only allowed inner block is the heading.
	const heading = useSelect(
		select => select( blockEditorStore ).getBlocks( clientId )[ 0 ],
		[ clientId ]
	);
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const headingClientId = heading?.clientId;
	const headingContent = heading ? String( heading.attributes.content ?? '' ) : null;

	// Only a change made in the heading itself flows back into the attribute,
	// so undoing one of the two updates never fights the other.
	const previousHeadingContent = useRef( headingContent );
	useEffect( () => {
		const changed = headingContent !== previousHeadingContent.current;
		previousHeadingContent.current = headingContent;
		if ( ! changed || headingContent === null ) {
			return;
		}

		const text = headingText( headingContent );
		if ( text !== playlistTitle ) {
			setAttributes( { playlistTitle: text } );
		}
	}, [ headingContent, playlistTitle, setAttributes ] );

	const template = useMemo< HeadingTemplate >(
		() =>
			showPlaylistTitle
				? [
						[
							'core/heading',
							{
								level: 2,
								content: escapeHTML( playlistTitle ),
								placeholder: __( 'Playlist title', 'jetpack-videopress-pkg' ),
							},
						],
					]
				: [],
		[ showPlaylistTitle, playlistTitle ]
	);

	const setPlaylistTitle = useCallback(
		( value: string ) => {
			setAttributes( { playlistTitle: value } );
			if ( headingClientId ) {
				updateBlockAttributes( headingClientId, { content: escapeHTML( value ) } );
			}
		},
		[ headingClientId, setAttributes, updateBlockAttributes ]
	);

	return { template, setPlaylistTitle };
}
