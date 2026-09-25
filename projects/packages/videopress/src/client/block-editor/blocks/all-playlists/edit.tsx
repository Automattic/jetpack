/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import {
	PanelBody,
	RadioControl,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { RawHTML, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { blockStyleVars } from './block-style-vars';
import { hydratePoster } from './hydrate-poster';
import { MAX_COLUMNS, MAX_PER_PAGE, MIN_COLUMNS, MIN_PER_PAGE } from './types';
import useRenderedPreview from './use-rendered-preview';
import './editor.scss';
/**
 * Types
 */
import type {
	AllPlaylistsAttributes,
	AllPlaylistsLayout,
	AllPlaylistsOrder,
	AllPlaylistsPagination,
} from './types';
import type { BlockEditProps } from '@wordpress/blocks';

/**
 * The block's one inner block: a core Heading the user edits in place, with
 * every heading option (level, typography, colors) the core block offers.
 */
const HEADING_TEMPLATE: Array< [ string, Record< string, unknown > ] > = [
	[ 'core/heading', { level: 2, content: __( 'Playlists', 'jetpack-videopress-pkg' ) } ],
];

/**
 * Keep a number setting inside its bounds.
 *
 * @param value    - Raw control value.
 * @param min      - Lower bound.
 * @param max      - Upper bound.
 * @param fallback - Value used when the input is not a number.
 * @return The clamped value.
 */
function clamp( value: unknown, min: number, max: number, fallback: number ): number {
	const number = Number( value );
	if ( ! Number.isFinite( number ) ) {
		return fallback;
	}
	return Math.min( max, Math.max( min, Math.round( number ) ) );
}

/**
 * All Playlists block edit component.
 *
 * The canvas shows the server-rendered block; the sidebar shows what the
 * index holds and sets the layout, per-card details and pagination.
 *
 * @param props               - Block edit props.
 * @param props.attributes    - Block attributes.
 * @param props.setAttributes - Attribute setter.
 * @return Edit component.
 */
export default function AllPlaylistsEdit( {
	attributes,
	setAttributes,
}: BlockEditProps< AllPlaylistsAttributes > ) {
	const { layout, columns, perPage, orderBy, showDescription, showVideoCount, pagination } =
		attributes;
	const { status, html, summary } = useRenderedPreview( attributes );

	const styleVars = blockStyleVars( attributes );
	const blockProps = useBlockProps( {
		className: [
			'videopress-all-playlists-editor videopress-all-playlists',
			`is-layout-${ layout }`,
			...styleVars.classes,
		].join( ' ' ),
		style: styleVars.style,
	} );
	const headingProps = useInnerBlocksProps(
		{ className: 'videopress-all-playlists__heading' },
		{
			allowedBlocks: [ 'core/heading' ],
			template: HEADING_TEMPLATE,
			templateLock: 'all',
			renderAppender: false,
		}
	);

	// The view script does not run in the canvas, so the cards' posters are
	// resolved here once the server markup is in the DOM.
	const previewRef = useRef< HTMLDivElement | null >( null );
	useEffect( () => {
		previewRef.current
			?.querySelectorAll< HTMLElement >( '.videopress-all-playlists__item' )
			.forEach( item => ! item.hidden && hydratePoster( item ) );
	}, [ html ] );

	const header = (
		<div className="videopress-all-playlists__header">
			<div { ...headingProps } />
			{ summary && <span className="videopress-all-playlists__summary">{ summary }</span> }
		</div>
	);

	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Display', 'jetpack-videopress-pkg' ) }>
				<ToggleGroupControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					isBlock
					label={ __( 'Show playlists as', 'jetpack-videopress-pkg' ) }
					value={ layout }
					onChange={ ( value?: string | number ) =>
						setAttributes( {
							layout: value === 'list' ? 'list' : ( 'gallery' as AllPlaylistsLayout ),
						} )
					}
				>
					<ToggleGroupControlOption
						value="gallery"
						label={ __( 'Gallery', 'jetpack-videopress-pkg' ) }
					/>
					<ToggleGroupControlOption value="list" label={ __( 'List', 'jetpack-videopress-pkg' ) } />
				</ToggleGroupControl>
				{ layout === 'gallery' && (
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						className="videopress-all-playlists-editor__control"
						label={ __( 'Columns', 'jetpack-videopress-pkg' ) }
						min={ MIN_COLUMNS }
						max={ MAX_COLUMNS }
						value={ clamp( columns, MIN_COLUMNS, MAX_COLUMNS, 3 ) }
						onChange={ ( value?: number ) =>
							setAttributes( { columns: clamp( value, MIN_COLUMNS, MAX_COLUMNS, 3 ) } )
						}
					/>
				) }
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					className="videopress-all-playlists-editor__control"
					type="number"
					min={ MIN_PER_PAGE }
					max={ MAX_PER_PAGE }
					label={ __( 'Playlists per page', 'jetpack-videopress-pkg' ) }
					value={ String( perPage ) }
					onChange={ ( value: string ) =>
						setAttributes( { perPage: clamp( value, MIN_PER_PAGE, MAX_PER_PAGE, 6 ) } )
					}
				/>
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					className="videopress-all-playlists-editor__control"
					label={ __( 'Order by', 'jetpack-videopress-pkg' ) }
					value={ orderBy }
					options={ [
						{ value: 'newest', label: __( 'Newest first', 'jetpack-videopress-pkg' ) },
						{ value: 'oldest', label: __( 'Oldest first', 'jetpack-videopress-pkg' ) },
						{ value: 'title', label: __( 'Title A–Z', 'jetpack-videopress-pkg' ) },
					] }
					onChange={ ( value: string ) => setAttributes( { orderBy: value as AllPlaylistsOrder } ) }
				/>
			</PanelBody>

			<PanelBody title={ __( 'Show on each playlist', 'jetpack-videopress-pkg' ) }>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Description', 'jetpack-videopress-pkg' ) }
					checked={ showDescription }
					onChange={ ( value: boolean ) => setAttributes( { showDescription: value } ) }
				/>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Video count', 'jetpack-videopress-pkg' ) }
					checked={ showVideoCount }
					onChange={ ( value: boolean ) => setAttributes( { showVideoCount: value } ) }
				/>
			</PanelBody>

			<PanelBody title={ __( 'Pagination', 'jetpack-videopress-pkg' ) }>
				<RadioControl
					label={ __( 'Pagination', 'jetpack-videopress-pkg' ) }
					hideLabelFromVision
					selected={ pagination }
					options={ [
						{ value: 'numbered', label: __( 'Numbered pages', 'jetpack-videopress-pkg' ) },
						{ value: 'load-more', label: __( '“Load more” button', 'jetpack-videopress-pkg' ) },
					] }
					onChange={ ( value: string ) =>
						setAttributes( { pagination: value as AllPlaylistsPagination } )
					}
				/>
			</PanelBody>
		</InspectorControls>
	);

	if ( status === 'loading' ) {
		return (
			<div { ...blockProps }>
				{ inspectorControls }
				<div
					className="videopress-all-playlists-editor__skeleton"
					role="status"
					aria-label={ __( 'Loading playlists…', 'jetpack-videopress-pkg' ) }
				>
					{ [ 0, 1, 2 ].map( index => (
						<div className="videopress-all-playlists-editor__skeleton-card" key={ index }>
							<span className="videopress-all-playlists-editor__skeleton-poster" />
							<span className="videopress-all-playlists-editor__skeleton-line" />
							<span className="videopress-all-playlists-editor__skeleton-line is-short" />
						</div>
					) ) }
				</div>
			</div>
		);
	}

	if ( status === 'error' || ! html ) {
		// Kept as separate statements so the minifier can't merge the __() calls.
		const errorLabel = __( 'The playlists could not be loaded', 'jetpack-videopress-pkg' );
		const emptyLabel = __( 'No playlists yet', 'jetpack-videopress-pkg' );
		const errorHelp = __( 'Reload the editor to try again.', 'jetpack-videopress-pkg' );
		const emptyHelp = __(
			'Playlists created with the Video Playlist block appear here automatically. Visitors see nothing until the first one is published.',
			'jetpack-videopress-pkg'
		);

		return (
			<div { ...blockProps }>
				{ inspectorControls }
				{ header }
				<div className="videopress-all-playlists-editor__empty">
					<span className="videopress-all-playlists-editor__empty-title">
						{ status === 'error' ? errorLabel : emptyLabel }
					</span>
					<span className="videopress-all-playlists-editor__empty-help">
						{ status === 'error' ? errorHelp : emptyHelp }
					</span>
				</div>
			</div>
		);
	}

	return (
		<div { ...blockProps }>
			{ inspectorControls }
			{ header }
			<div ref={ previewRef }>
				<RawHTML>{ html }</RawHTML>
			</div>
		</div>
	);
}
