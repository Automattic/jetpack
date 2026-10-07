/* @jsxImportSource react */
import { BlockControls, BlockIcon, useBlockProps } from '@wordpress/block-editor';
import { embedContentIcon } from '@wordpress/block-library/build-module/embed/icons.mjs';
import {
	createBlock,
	getBlockType,
	registerBlockType,
	type Block,
	type BlockEditProps,
} from '@wordpress/blocks';
import {
	Button,
	Placeholder,
	SandBox,
	Spinner,
	ToolbarButton,
	ToolbarGroup,
	VisuallyHidden,
} from '@wordpress/components';
import { renderToString, useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import type { EditorLabels } from '../shared/types';
import type { ChangeEvent, FormEvent } from 'react';

const NAME = 'core/embed';

type Attributes = { url?: string };
/** What the preview route answers: core's proxy shape. */
type Preview = { html?: string; scripts?: string[] };
/** What a lookup settled on: data, a URL the site will not embed, or a failure worth retrying. */
type Lookup = Preview | 'unsupported' | null;
type EditProps = BlockEditProps< Attributes > & {
	onReplace: ( blocks: Block | Block[] ) => void;
};

let labels: EditorLabels;

// Module scope, where Terser cannot fold the two calls into one `_x( failed ? … : … )`.
const embedLabel = _x( 'Embed', 'button label', 'default' );
const retryLabel = _x( 'Try again', 'button label', 'default' );

// The server already vetted the URL; a parse failure here should cost the block, not the editor.
const hostOf = ( url: string ) => {
	try {
		return new URL( url ).host;
	} catch {
		return url;
	}
};

const toParagraph = ( url: string ) =>
	createBlock( 'core/paragraph', { content: renderToString( <a href={ url }>{ url }</a> ) } );

const Edit = ( { attributes: { url }, setAttributes, isSelected, onReplace }: EditProps ) => {
	const [ draft, setDraft ] = useState( url ?? '' );
	const [ editing, setEditing ] = useState( ! url );
	const [ preview, setPreview ] = useState< Preview | null >( null );
	const [ failed, setFailed ] = useState( false );
	const [ attempt, setAttempt ] = useState( 0 );
	const [ interactive, setInteractive ] = useState( false );
	// Read inside the effect below, which keys on the URL alone.
	const replace = useRef( onReplace );
	replace.current = onReplace;
	const blockProps = useBlockProps();

	// A URL the site will not embed, or a route it closes, becomes a link, with no fuss: most links in
	// a comment are just links. A rate limit or a dropped request keeps the block so the reader can retry.
	useEffect( () => {
		if ( ! url ) {
			return;
		}

		let stale = false;
		setPreview( null );
		setFailed( false );
		const target = new URL( labels.embedUrl, window.location.href );
		target.searchParams.set( 'url', url );
		fetch( target.toString(), { credentials: 'omit' } )
			.then( ( response ): Promise< Lookup > | Lookup => {
				if ( response.status >= 400 && response.status < 500 && response.status !== 429 ) {
					return 'unsupported';
				}
				return response.ok ? ( response.json() as Promise< Preview > ) : null;
			} )
			.catch( (): Lookup => null )
			.then( data => {
				if ( stale ) {
					return;
				}
				if ( data === 'unsupported' ) {
					replace.current( toParagraph( url ) );
				} else if ( data?.html ) {
					setPreview( data );
				} else {
					setFailed( true );
				}
			} );

		return () => {
			stale = true;
		};
	}, [ url, attempt ] );

	useEffect( () => {
		if ( ! isSelected ) {
			setInteractive( false );
		}
	}, [ isSelected ] );

	const onInput = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => setDraft( event.target.value ),
		[]
	);
	const onSubmit = useCallback(
		( event: FormEvent ) => {
			event.preventDefault();
			const next = draft.trim();
			if ( next ) {
				setEditing( false );
				setAttempt( count => count + 1 );
				setAttributes( { url: next } );
			}
		},
		[ draft, setAttributes ]
	);
	const onEdit = useCallback( () => setEditing( true ), [] );
	const onInteract = useCallback( () => setInteractive( true ), [] );

	if ( editing || failed || ! url ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon={ <BlockIcon icon={ embedContentIcon } showColors /> }
					label={ _x( 'Embed', 'block title', 'default' ) }
				>
					{ failed && (
						<p className="components-placeholder__error">
							{ __( 'Sorry, this content could not be embedded.', 'default' ) }
						</p>
					) }
					<form onSubmit={ onSubmit }>
						<input
							type="url"
							aria-label={ _x( 'Embed', 'block title', 'default' ) }
							placeholder={ __( 'Enter URL to embed here…', 'default' ) }
							value={ draft }
							onChange={ onInput }
						/>
						<Button __next40pxDefaultSize variant="primary" type="submit">
							{ failed ? retryLabel : embedLabel }
						</Button>
					</form>
				</Placeholder>
			</div>
		);
	}

	if ( ! preview ) {
		return (
			<div { ...blockProps } aria-busy="true">
				<Spinner />
				<VisuallyHidden>{ __( 'Loading…', 'default' ) }</VisuallyHidden>
			</div>
		);
	}

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton onClick={ onEdit }>{ __( 'Edit URL', 'default' ) }</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<figure { ...blockProps }>
				<div className="wp-block-embed__wrapper">
					{ /* Same-origin, as core previews embeds: a trusted provider's script runs in the page once posted anyway. */ }
					<SandBox
						allowSameOrigin
						html={ preview.html }
						scripts={ preview.scripts }
						title={ sprintf(
							/* translators: %s: host providing embed content e.g: www.youtube.com */
							__( 'Embedded content from %s', 'default' ),
							hostOf( url )
						) }
						onFocus={ onInteract }
					/>
					{ /* Catches the first click, so the block is selected before the frame gets the pointer. */ }
					{ ! interactive && (
						// eslint-disable-next-line jsx-a11y/no-static-element-interactions
						<div className="jetpack-comments__embed-overlay" onMouseUp={ onInteract } />
					) }
				</div>
			</figure>
		</>
	);
};

/**
 * Register the embed block: core's name, so the comment stores `wp:embed`, with an edit of
 * this package's own. Nothing registers without the preview route.
 *
 * @param editorLabels - The editor's labels, with the route.
 */
export const registerEmbedBlock = ( editorLabels: EditorLabels ) => {
	labels = editorLabels;

	if ( ! labels.embedUrl || getBlockType( NAME ) ) {
		return;
	}

	registerBlockType< Attributes >( NAME, {
		title: _x( 'Embed', 'block title', 'default' ),
		category: 'embed',
		icon: embedContentIcon,
		attributes: { url: { type: 'string' } },
		edit: Edit,
		save: ( { attributes: { url } } ) =>
			url ? (
				<figure { ...useBlockProps.save() }>
					<div className="wp-block-embed__wrapper">{ `\n${ url }\n` }</div>
				</figure>
			) : null,
		transforms: {
			from: [
				{
					type: 'raw',
					isMatch: ( node: Node ) =>
						node.nodeName === 'P' && /^https?:\/\/\S+$/i.test( node.textContent?.trim() ?? '' ),
					transform: ( node: Node ) => createBlock( NAME, { url: node.textContent!.trim() } ),
				},
			],
			to: [
				{
					type: 'block',
					blocks: [ 'core/paragraph' ],
					transform: ( { url }: Attributes ) => toParagraph( url ?? '' ),
				},
			],
		},
	} );
};
