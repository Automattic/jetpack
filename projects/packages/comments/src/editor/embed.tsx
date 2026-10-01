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
} from '@wordpress/components';
import { renderToString, useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import type { EditorLabels } from '../shared/types';
import type { ChangeEvent, FormEvent } from 'react';

const NAME = 'core/embed';

type Attributes = { url?: string };
/** What the preview route answers: core's proxy shape. */
type Preview = { html?: string; scripts?: string[] };
type EditProps = BlockEditProps< Attributes > & { onReplace: ( blocks: Block | Block[] ) => void };

let labels: EditorLabels;

const toParagraph = ( url: string ) =>
	createBlock( 'core/paragraph', { content: renderToString( <a href={ url }>{ url }</a> ) } );

const Edit = ( { attributes: { url }, setAttributes, isSelected, onReplace }: EditProps ) => {
	const [ draft, setDraft ] = useState( url ?? '' );
	const [ editing, setEditing ] = useState( ! url );
	const [ preview, setPreview ] = useState< Preview | null >( null );
	const [ interactive, setInteractive ] = useState( false );
	const replace = useRef( onReplace );
	replace.current = onReplace;
	const blockProps = useBlockProps();

	// A URL the site will not embed becomes a link, with no fuss: most links in a comment are just links.
	useEffect( () => {
		if ( ! url ) {
			return;
		}

		let stale = false;
		setPreview( null );
		const target = new URL( labels.embedUrl, window.location.href );
		target.searchParams.set( 'url', url );
		fetch( target.toString(), { credentials: 'omit' } )
			.then( response => ( response.ok ? ( response.json() as Promise< Preview > ) : null ) )
			.catch( () => null )
			.then( data => {
				if ( stale ) {
					return;
				}
				if ( data?.html ) {
					setPreview( data );
				} else {
					replace.current( toParagraph( url ) );
				}
			} );

		return () => {
			stale = true;
		};
	}, [ url ] );

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
				setAttributes( { url: next } );
			}
		},
		[ draft, setAttributes ]
	);
	const onEdit = useCallback( () => setEditing( true ), [] );
	const onInteract = useCallback( () => setInteractive( true ), [] );

	if ( editing || ! url ) {
		return (
			<div { ...blockProps }>
				<Placeholder
					icon={ <BlockIcon icon={ embedContentIcon } showColors /> }
					label={ _x( 'Embed', 'block title', 'default' ) }
				>
					<form onSubmit={ onSubmit }>
						<input
							type="url"
							aria-label={ _x( 'Embed', 'block title', 'default' ) }
							placeholder={ __( 'Enter URL to embed here…', 'default' ) }
							value={ draft }
							onChange={ onInput }
						/>
						<Button __next40pxDefaultSize variant="primary" type="submit">
							{ _x( 'Embed', 'button label', 'default' ) }
						</Button>
					</form>
				</Placeholder>
			</div>
		);
	}

	if ( ! preview ) {
		return (
			<div { ...blockProps }>
				<Spinner />
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
							new URL( url ).host
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
						node.nodeName === 'P' && /^https:\/\/\S+$/i.test( node.textContent?.trim() ?? '' ),
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
