/* @jsxImportSource react */
import { BlockControls, BlockIcon, RichText, useBlockProps } from '@wordpress/block-editor';
import metadata from '@wordpress/block-library/build-module/embed/block.json';
import deprecated from '@wordpress/block-library/build-module/embed/deprecated.mjs';
import { embedContentIcon } from '@wordpress/block-library/build-module/embed/icons.mjs';
import save from '@wordpress/block-library/build-module/embed/save.mjs';
import transforms from '@wordpress/block-library/build-module/embed/transforms.mjs';
import {
	fallback,
	findMoreSuitableBlock,
	getAttributesFromPreview,
	getEmbedInfoByProvider,
	getPhotoHtml,
	removeAspectRatioClasses,
} from '@wordpress/block-library/build-module/embed/util.mjs';
import variations from '@wordpress/block-library/build-module/embed/variations.mjs';
import {
	createBlock,
	getBlockType,
	getDefaultBlockName,
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
import { useCallback, useEffect, useState } from '@wordpress/element';
import clsx from 'clsx';
import type { EditorLabels } from '../shared/types';
import type { ChangeEvent, FormEvent } from 'react';

type Attributes = {
	url?: string;
	caption?: string;
	type?: string;
	providerNameSlug?: string;
	className?: string;
	responsive?: boolean;
	allowResponsive?: boolean;
};

/** What the preview route answers: core's proxy shape. */
type Preview = {
	html?: string | false;
	type?: string;
	provider_name?: string;
	scripts?: string[];
	url?: string;
};

type Variation = { name: string; patterns?: RegExp[]; icon?: unknown; title?: string };

// The list handles these two, which the props type leaves out.
type EditProps = BlockEditProps< Attributes > & {
	onReplace: ( blocks: Block[] ) => void;
	insertBlocksAfter: ( blocks: Block | Block[] ) => void;
};

let labels: EditorLabels;

// One request per URL for the page, however often the block re-renders or is undone back in.
const previews = new Map< string, Promise< Preview | null > >();

const fetchPreview = ( url: string, fresh = false ) => {
	if ( fresh ) {
		previews.delete( url );
	}

	let pending = previews.get( url );

	if ( ! pending ) {
		const target = new URL( labels.embedUrl, window.location.href );
		target.searchParams.set( 'url', url );
		pending = fetch( target.toString(), { credentials: 'omit' } )
			.then( response => ( response.ok ? ( response.json() as Promise< Preview > ) : null ) )
			.catch( () => null );
		previews.set( url, pending );
	}

	return pending;
};

type FormProps = {
	icon: unknown;
	title: string;
	value: string;
	failed: boolean;
	onChange: ( value: string ) => void;
	onSubmit: ( event: FormEvent ) => void;
	onRetry: () => void;
	onFallback: () => void;
};

const Form = ( {
	icon,
	title,
	value,
	failed,
	onChange,
	onSubmit,
	onRetry,
	onFallback,
}: FormProps ) => {
	const onInput = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => onChange( event.target.value ),
		[ onChange ]
	);

	return (
		<Placeholder
			icon={ <BlockIcon icon={ icon } showColors /> }
			label={ title }
			className="wp-block-embed"
			instructions={ labels.embed.hint }
		>
			<form onSubmit={ onSubmit }>
				<input
					type="url"
					className="wp-block-embed__placeholder-input"
					aria-label={ title }
					placeholder={ labels.embed.placeholder }
					value={ value }
					onChange={ onInput }
				/>
				<Button __next40pxDefaultSize variant="primary" type="submit">
					{ labels.embed.button }
				</Button>
			</form>
			{ failed && (
				<div className="components-placeholder__error">
					<p className="components-placeholder__instructions">{ labels.embed.failed }</p>
					<Button __next40pxDefaultSize variant="secondary" onClick={ onRetry }>
						{ labels.embed.retry }
					</Button>
					<Button __next40pxDefaultSize variant="secondary" onClick={ onFallback }>
						{ labels.embed.toLink }
					</Button>
				</div>
			) }
		</Placeholder>
	);
};

const Edit = ( {
	attributes,
	setAttributes,
	isSelected,
	onReplace,
	insertBlocksAfter,
}: EditProps ) => {
	const { url, caption, type, providerNameSlug, className, responsive, allowResponsive } =
		attributes;
	const info = getEmbedInfoByProvider( providerNameSlug ) as Variation | undefined;
	const icon = info?.icon ?? embedContentIcon;
	const title = info?.title ?? getBlockType( metadata.name )?.title ?? '';
	const [ draft, setDraft ] = useState( url ?? '' );
	const [ editing, setEditing ] = useState( ! url );
	// Undefined while it loads; null when the site will not embed it.
	const [ preview, setPreview ] = useState< Preview | null | undefined >();
	const [ attempt, setAttempt ] = useState( 0 );
	const [ interactive, setInteractive ] = useState( false );

	useEffect( () => {
		if ( ! url ) {
			return;
		}

		let stale = false;
		setPreview( undefined );
		fetchPreview( url, attempt > 0 ).then( data => {
			if ( ! stale ) {
				setPreview( data );
			}
		} );

		return () => {
			stale = true;
		};
	}, [ url, attempt ] );

	// The type, provider, and aspect ratio the preview shows, which the saved markup carries as classes.
	useEffect( () => {
		if ( preview ) {
			setAttributes(
				getAttributesFromPreview( preview, title, className, responsive, allowResponsive )
			);
		}
	}, [ preview, title, className, responsive, allowResponsive, setAttributes ] );

	useEffect( () => {
		if ( ! isSelected ) {
			setInteractive( false );
		}
	}, [ isSelected ] );

	const blockProps = useBlockProps( {
		className: clsx( 'wp-block-embed', {
			[ `is-type-${ type }` ]: type,
			[ `is-provider-${ providerNameSlug }` ]: providerNameSlug,
			[ `wp-block-embed-${ providerNameSlug }` ]: providerNameSlug,
		} ),
	} );

	const onSubmit = useCallback(
		( event: FormEvent ) => {
			event.preventDefault();
			const next = draft.trim();

			if ( ! next ) {
				return;
			}

			setEditing( false );

			if ( next !== url ) {
				// The provider's own variation, when it has one, and a clean slate for the preview's classes.
				setAttributes( {
					url: next,
					type: undefined,
					providerNameSlug: undefined,
					className: removeAspectRatioClasses( className ),
					...( ( findMoreSuitableBlock( next ) as { attributes?: Attributes } | undefined )
						?.attributes ?? {} ),
				} );
			}
		},
		[ draft, url, className, setAttributes ]
	);
	const onRetry = useCallback( () => setAttempt( count => count + 1 ), [] );
	const onFallback = useCallback( () => fallback( url, onReplace ), [ url, onReplace ] );
	const onEdit = useCallback( () => setEditing( true ), [] );
	const onInteract = useCallback( () => setInteractive( true ), [] );
	const onCaption = useCallback(
		( value: string ) => setAttributes( { caption: value } ),
		[ setAttributes ]
	);
	const onCaptionEnd = useCallback(
		() => insertBlocksAfter( createBlock( getDefaultBlockName()! ) ),
		[ insertBlocksAfter ]
	);

	const form = (
		<Form
			icon={ icon }
			title={ title }
			value={ draft }
			failed={ ! editing && preview === null }
			onChange={ setDraft }
			onSubmit={ onSubmit }
			onRetry={ onRetry }
			onFallback={ onFallback }
		/>
	);

	if ( editing || ! url || preview === null ) {
		return <div { ...blockProps }>{ form }</div>;
	}

	if ( ! preview ) {
		return (
			<div { ...blockProps }>
				<div className="wp-block-embed is-loading">
					<Spinner />
				</div>
			</div>
		);
	}

	const html = 'photo' === type ? getPhotoHtml( preview ) : preview.html || '';
	const host = new URL( url, window.location.href ).host;

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton onClick={ onEdit }>{ labels.embed.editUrl }</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<figure { ...blockProps }>
				<div className="wp-block-embed__wrapper">
					{ /* Same-origin, as core previews embeds: a trusted provider's script runs in the page once posted anyway. */ }
					<SandBox
						allowSameOrigin
						html={ html }
						scripts={ preview.scripts }
						title={ labels.embed.from.replace( '%s', host ) }
						type={ clsx( type, className, 'wp-block-embed__wrapper' ) }
						onFocus={ onInteract }
					/>
					{ /* Catches the first click, so the block is selected before the frame gets the pointer. */ }
					{ ! interactive && (
						// eslint-disable-next-line jsx-a11y/no-static-element-interactions
						<div className="jetpack-comments__embed-overlay" onMouseUp={ onInteract } />
					) }
				</div>
				{ ( ! RichText.isEmpty( caption ) || isSelected ) && (
					<RichText
						identifier="caption"
						tagName="figcaption"
						className="wp-element-caption"
						placeholder={ labels.embed.caption }
						value={ caption }
						onChange={ onCaption }
						__unstableOnSplitAtEnd={ onCaptionEnd }
					/>
				) }
			</figure>
		</>
	);
};

/**
 * Register core's embed block with this edit in place of core's, which needs the site data
 * store. Core's save, so the markup matches what the site's posts and WordPress.com write.
 *
 * @param editorLabels - The editor's strings, with the preview route; nothing registers without one.
 */
export const registerEmbedBlock = ( editorLabels: EditorLabels ) => {
	labels = editorLabels;

	if ( ! labels.embedUrl || getBlockType( metadata.name ) ) {
		return;
	}

	registerBlockType(
		{ name: metadata.name, ...metadata } as unknown as Parameters< typeof registerBlockType >[ 0 ],
		{
			icon: embedContentIcon,
			edit: Edit,
			save,
			transforms,
			deprecated,
			// The providers a pasted link can reach; the rest have no URL shape to match, or do not answer.
			variations: ( variations as Variation[] ).filter(
				( { name, patterns } ) => patterns?.length && name !== 'imgur'
			),
		} as Parameters< typeof registerBlockType >[ 1 ]
	);
};
