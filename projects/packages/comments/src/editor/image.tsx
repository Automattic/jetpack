/* @jsxImportSource react */
import { BlockControls, BlockIcon, useBlockProps } from '@wordpress/block-editor';
import { createBlock, getBlockType, registerBlockType } from '@wordpress/blocks';
import { Button, Placeholder, ToolbarButton, ToolbarGroup } from '@wordpress/components';
import {
	renderToString,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from '@wordpress/element';
// Not destructured: embed.tsx takes `__` in the chunk's scope, and a renamed call hides its string from the i18n check.
import * as i18n from '@wordpress/i18n';
import type { ImageAttributes, ImageEditProps } from './types';
import type { EditorLabels } from '../shared/types';
import type { ChangeEvent, FormEvent } from 'react';

const NAME = 'core/image';

let labels: EditorLabels;

// Off on the edit-comment screen, where loading the image would tell its host who moderates.
let previewImages = true;

// The image icon from @wordpress/icons, a large package for one icon.
const icon = (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width="24"
		height="24"
		aria-hidden="true"
		focusable="false"
	>
		<path
			d="M3.75 16.2031L8.6 12.7L12 15L16 11L20.25 15.2517M5 20.25H19C19.6904 20.25 20.25 19.6904 20.25 19V5C20.25 4.30964 19.6904 3.75 19 3.75H5C4.30964 3.75 3.75 4.30964 3.75 5V19C3.75 19.6904 4.30964 20.25 5 20.25Z"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinejoin="round"
		/>
	</svg>
);

// Readers load the image straight from its URL. The server shows an http one as a link, since it would be mixed content.
const httpsUrl = ( url: string ) => {
	try {
		const parsed = new URL( url );
		return parsed.protocol === 'https:' ? parsed : null;
	} catch {
		return null;
	}
};

const imgSchema = { attributes: [ 'src' ] };

const toParagraph = ( url: string ) =>
	createBlock( 'core/paragraph', { content: renderToString( <a href={ url }>{ url }</a> ) } );

const Edit = ( { attributes: { url }, setAttributes, isSelected }: ImageEditProps ) => {
	const [ draft, setDraft ] = useState( url ?? '' );
	const [ editing, setEditing ] = useState( ! url );
	const [ failed, setFailed ] = useState( false );
	const urlInput = useRef< HTMLInputElement >( null );
	const wrapper = useRef< HTMLElement >( null );
	// Whether focus follows the form opening or closing: what the reader was on just went away.
	const refocus = useRef( false );
	const errorId = useId();
	const blockProps = useBlockProps( { ref: wrapper } );

	useEffect( () => {
		if ( refocus.current ) {
			refocus.current = false;
			( editing ? urlInput.current : wrapper.current )?.focus();
		}
	}, [ editing ] );

	// Undo can bring back a URL the form cleared, which the open form would otherwise hide.
	useEffect( () => {
		if ( url ) {
			setEditing( false );
			setFailed( false );
		}
	}, [ url ] );

	const onUrl = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => setDraft( event.target.value ),
		[]
	);
	const onSubmit = useCallback(
		( event: FormEvent ) => {
			event.preventDefault();
			const next = draft.trim();
			if ( ! next ) {
				return;
			}
			// An http or data: URL would preview here, then reach readers as a link or not at all.
			if ( ! httpsUrl( next ) ) {
				setFailed( true );
				urlInput.current?.focus();
				return;
			}
			refocus.current = true;
			setEditing( false );
			setFailed( false );
			setAttributes( { url: next } );
		},
		[ draft, setAttributes ]
	);
	const onEdit = useCallback( () => {
		refocus.current = true;
		setDraft( url ?? '' );
		setEditing( true );
	}, [ url ] );
	// Not an image the browser can draw. Cleared so it is never posted; the form keeps it to correct.
	const onError = useCallback( () => {
		refocus.current = isSelected;
		setFailed( true );
		setEditing( true );
		setAttributes( { url: undefined } );
	}, [ isSelected, setAttributes ] );

	if ( editing || ! url ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon={ <BlockIcon icon={ icon } showColors /> }
					label={ i18n._x( 'Image', 'block title', 'default' ) }
				>
					{ failed && (
						<p id={ errorId } className="components-placeholder__error" role="alert">
							{ labels.imageError }
						</p>
					) }
					<form onSubmit={ onSubmit }>
						<input
							ref={ urlInput }
							type="url"
							aria-label={ i18n.__( 'URL', 'default' ) }
							aria-describedby={ failed ? errorId : undefined }
							aria-invalid={ failed || undefined }
							placeholder={ i18n.__( 'Paste or type URL', 'default' ) }
							value={ draft }
							onChange={ onUrl }
						/>
						<Button __next40pxDefaultSize variant="primary" type="submit">
							{ i18n.__( 'Apply', 'default' ) }
						</Button>
					</form>
				</Placeholder>
			</div>
		);
	}

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton onClick={ onEdit }>{ i18n.__( 'Edit image', 'default' ) }</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<figure { ...blockProps }>
				{ previewImages ? (
					<img src={ url } alt="" referrerPolicy="no-referrer" onError={ onError } />
				) : (
					url
				) }
			</figure>
		</>
	);
};

/**
 * Register the image block: core's name, so the comment stores `wp:image`, with an edit of this
 * package's own that takes a URL, never an upload. Nothing registers where images are off.
 *
 * @param editorLabels - The editor's labels, with whether the site offers images.
 * @param preview      - Whether to load the image. Off, the block shows its URL.
 */
export const registerImageBlock = ( editorLabels: EditorLabels, preview = true ) => {
	labels = editorLabels;
	previewImages = preview;

	if ( ! labels.images || getBlockType( NAME ) ) {
		return;
	}

	registerBlockType< ImageAttributes >( NAME, {
		apiVersion: 3,
		title: i18n._x( 'Image', 'block title', 'default' ),
		category: 'media',
		icon,
		attributes: { url: { type: 'string' } },
		edit: Edit,
		// The URL as text, never an img: see Images in class-images.php.
		save: ( { attributes: { url } } ) =>
			url ? <figure { ...useBlockProps.save() }>{ url }</figure> : null,
		transforms: {
			from: [
				{
					type: 'raw',
					// Ahead of the embed block's, which takes any URL on its own line; this one only an image file's.
					priority: 9,
					isMatch: ( node: Node ) =>
						node.nodeName === 'P' &&
						/\.(?:avif|gif|jpe?g|png|webp)$/i.test(
							httpsUrl( node.textContent?.trim() ?? '' )?.pathname ?? ''
						),
					transform: ( node: Node ) => createBlock( NAME, { url: node.textContent!.trim() } ),
				},
				{
					// An image dropped or pasted from another page, which raw handling wraps in a figure.
					type: 'raw',
					schema: {
						figure: {
							require: [ 'img' ],
							children: {
								img: imgSchema,
								a: { attributes: [ 'href' ], children: { img: imgSchema } },
							},
						},
					},
					isMatch: ( node: Node ) =>
						node.nodeName === 'FIGURE' &&
						/^https?:/i.test(
							( node as Element ).querySelector( 'img' )?.getAttribute( 'src' ) ?? ''
						),
					// An http image would only reach readers as a link, so it starts as one.
					transform: ( node: Node ) => {
						const img = ( node as Element ).querySelector( 'img' )!;
						const url = img.getAttribute( 'src' )!;
						return httpsUrl( url ) ? createBlock( NAME, { url } ) : toParagraph( url );
					},
				},
			],
			to: [
				{
					type: 'block',
					blocks: [ 'core/paragraph' ],
					transform: ( { url }: ImageAttributes ) => toParagraph( url ?? '' ),
				},
			],
		},
	} );
};
