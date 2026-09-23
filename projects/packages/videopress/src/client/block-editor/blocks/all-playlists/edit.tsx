/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
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
import { RawHTML } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
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
	const {
		layout,
		columns,
		perPage,
		orderBy,
		showDescription,
		showVideoCount,
		showTotalRuntime,
		pagination,
	} = attributes;
	const { status, html, stats } = useRenderedPreview( attributes );

	const blockProps = useBlockProps( {
		className: `videopress-all-playlists-editor is-layout-${ layout }`,
	} );

	const indexSummary = sprintf(
		/* translators: 1: number of playlists, e.g. "18 playlists". 2: number of videos, e.g. "214 videos". */
		__( '%1$s · %2$s', 'jetpack-videopress-pkg' ),
		sprintf(
			/* translators: %d: number of playlists in the index. */
			_n( '%d playlist', '%d playlists', stats.playlists, 'jetpack-videopress-pkg' ),
			stats.playlists
		),
		sprintf(
			/* translators: %d: number of videos across the indexed playlists. */
			_n( '%d video', '%d videos', stats.videos, 'jetpack-videopress-pkg' ),
			stats.videos
		)
	);

	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Source', 'jetpack-videopress-pkg' ) }>
				<div className="videopress-all-playlists-editor__source">
					<span className="videopress-all-playlists-editor__source-text">
						<span className="videopress-all-playlists-editor__source-name">
							{ __( 'Playlist index', 'jetpack-videopress-pkg' ) }
						</span>
						<span className="videopress-all-playlists-editor__source-count">{ indexSummary }</span>
					</span>
					<span
						className={
							stats.playlists > 0
								? 'videopress-all-playlists-editor__source-dot is-ready'
								: 'videopress-all-playlists-editor__source-dot'
						}
						aria-hidden="true"
					/>
				</div>
				<p className="videopress-all-playlists-editor__help">
					{ __(
						'Posters come from the first VideoPress video in each playlist.',
						'jetpack-videopress-pkg'
					) }
				</p>
			</PanelBody>

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
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Total runtime', 'jetpack-videopress-pkg' ) }
					checked={ showTotalRuntime }
					onChange={ ( value: boolean ) => setAttributes( { showTotalRuntime: value } ) }
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
			<RawHTML>{ html }</RawHTML>
		</div>
	);
}
