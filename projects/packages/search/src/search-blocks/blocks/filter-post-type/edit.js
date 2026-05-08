/**
 * Editor preview for jetpack-search/filter-post-type.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { FormTokenField, Icon, PanelBody, RadioControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { unseen } from '@wordpress/icons';

const MODE_INCLUDE = 'include';
const MODE_EXCLUDE = 'exclude';

/**
 * `sanitize_key()` (PHP) approximation: lowercase + strip everything that
 * is not `[a-z0-9_-]`. Mirrors the server normalizer so editor-stored
 * attributes match what eventually reaches ES.
 *
 * @param {string} value - Raw token string.
 * @return {string} Sanitized slug.
 */
function sanitizeKey( value ) {
	return String( value || '' )
		.toLowerCase()
		.replace( /[^a-z0-9_-]+/g, '' );
}

/**
 * Append `(slug)` to any label that occurs more than once so each suggestion
 * label maps 1:1 to a slug — without this the FormTokenField label→slug
 * lookup picks an arbitrary winner when two CPTs share a `singular_name`.
 *
 * @param {Array<{value: string, label: string}>} options - Raw slug/label list.
 * @return {Array<{value: string, label: string}>} Disambiguated.
 */
function disambiguateLabels( options ) {
	const counts = new Map();
	for ( const { label } of options ) {
		counts.set( label, ( counts.get( label ) || 0 ) + 1 );
	}
	return options.map( opt =>
		counts.get( opt.label ) > 1 ? { ...opt, label: `${ opt.label } (${ opt.value })` } : opt
	);
}

/**
 * Map slugs to FormTokenField's `{value, title}` shape.
 *
 * @param {string[]} slugs       - Stored slug list.
 * @param {Map}      labelBySlug - slug → label.
 * @return {Array<{ value: string, title: string }>} Token shape.
 */
function toTokens( slugs, labelBySlug ) {
	return ( slugs || [] ).map( slug => ( {
		value: slug,
		title: labelBySlug.get( slug ) || slug,
	} ) );
}

/**
 * Convert FormTokenField output back to a sanitized, deduped slug list.
 * Free-typed values pass through `sanitizeKey` so editor and server agree.
 *
 * @param {Array<string|{value: string}>}         tokens  - Tokens from onChange.
 * @param {Array<{value: string, label: string}>} options - Resolved options for label→slug lookup.
 * @return {string[]} Sanitized slugs.
 */
function tokensToSlugs( tokens, options ) {
	const out = [];
	for ( const token of tokens || [] ) {
		const raw = typeof token === 'string' ? labelFromTokenString( token, options ) : token?.value;
		const slug = sanitizeKey( raw );
		if ( slug && ! out.includes( slug ) ) {
			out.push( slug );
		}
	}
	return out;
}

/**
 * Edit component for the filter-post-type block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function FilterPostTypeEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	const mode = attributes?.mode === MODE_INCLUDE ? MODE_INCLUDE : MODE_EXCLUDE;
	const postTypes = useMemo(
		() => ( Array.isArray( attributes?.postTypes ) ? attributes.postTypes : [] ),
		[ attributes?.postTypes ]
	);

	// `viewable !== false` filter is a UX nicety; the canonical allowlist
	// (`exclude_from_search => false`) is enforced server-side because the
	// REST endpoint does not expose that flag.
	const registeredTypes = useSelect(
		select => select( 'core' ).getPostTypes( { per_page: -1 } ),
		[]
	);

	const options = useMemo( () => {
		if ( ! Array.isArray( registeredTypes ) ) {
			return null;
		}
		return disambiguateLabels(
			registeredTypes
				.filter( type => type?.slug && type.slug !== 'attachment' && type?.viewable !== false )
				.map( type => ( {
					value: type.slug,
					label: type?.labels?.singular_name || type?.name || type.slug,
				} ) )
		);
	}, [ registeredTypes ] );

	const labelBySlug = useMemo( () => {
		const map = new Map();
		( options || [] ).forEach( option => map.set( option.value, option.label ) );
		return map;
	}, [ options ] );

	const suggestionList = useMemo(
		() => ( options || [] ).map( option => option.label ),
		[ options ]
	);

	const previewState = describePreview( mode, postTypes, labelBySlug );

	// Per-mode draft cache. Flipping back to a previously-used mode restores
	// the typed list; only the active mode's `postTypes` is persisted.
	const draftRef = useRef( null );
	if ( draftRef.current === null ) {
		draftRef.current = {
			[ MODE_INCLUDE ]: mode === MODE_INCLUDE ? postTypes : [],
			[ MODE_EXCLUDE ]: mode === MODE_EXCLUDE ? postTypes : [],
		};
	}

	const handleModeChange = nextMode => {
		if ( nextMode === mode ) {
			return;
		}
		draftRef.current = { ...draftRef.current, [ mode ]: postTypes };
		setAttributes( {
			mode: nextMode,
			postTypes: draftRef.current[ nextMode ] || [],
		} );
	};

	const handlePostTypesChange = tokens => {
		const slugs = tokensToSlugs( tokens, options );
		draftRef.current = { ...draftRef.current, [ mode ]: slugs };
		setAttributes( { postTypes: slugs } );
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-search-pkg' ) }>
					<RadioControl
						label={ __( 'Mode', 'jetpack-search-pkg' ) }
						selected={ mode }
						options={ [
							{
								label: __(
									'Exclude — remove the selected post types from results',
									'jetpack-search-pkg'
								),
								value: MODE_EXCLUDE,
							},
							{
								label: __(
									'Include only — search will return only the selected post types',
									'jetpack-search-pkg'
								),
								value: MODE_INCLUDE,
							},
						] }
						onChange={ handleModeChange }
					/>
					<FormTokenField
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={
							mode === MODE_INCLUDE
								? __( 'Post types to include', 'jetpack-search-pkg' )
								: __(
										'Post types to exclude',
										'jetpack-search-pkg',
										/* dummy arg to avoid bad minification */ 0
								  )
						}
						value={ toTokens( postTypes, labelBySlug ) }
						suggestions={ suggestionList }
						__experimentalExpandOnFocus
						__experimentalShowHowTo={ false }
						onChange={ handlePostTypesChange }
					/>
					<p
						className="jetpack-search-filter-post-type__hint"
						style={ {
							color: 'rgba(30, 30, 30, 0.62)',
							fontSize: '12px',
							fontStyle: 'italic',
							marginTop: '12px',
							marginBottom: 0,
						} }
					>
						{ __(
							'This block does not render anything on the front end — it only constrains which post types Jetpack Search returns.',
							'jetpack-search-pkg'
						) }
					</p>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<p
					style={ {
						display: 'flex',
						alignItems: 'center',
						gap: '4px',
						margin: '0 0 4px',
						fontSize: '11px',
						textTransform: 'uppercase',
						letterSpacing: '0.4px',
						color: 'rgba(30, 30, 30, 0.55)',
					} }
				>
					<Icon icon={ unseen } size={ 14 } />
					<span>{ __( 'Hidden on the front end', 'jetpack-search-pkg' ) }</span>
				</p>
				<h3
					className="jetpack-search-filter-post-type__title"
					style={ { margin: '0 0 4px', fontSize: '14px', fontWeight: 600 } }
				>
					{ __( 'Post Type Scope', 'jetpack-search-pkg' ) }
				</h3>
				<p style={ { margin: 0, fontSize: '13px' } }>
					<strong>{ previewState.label }</strong> { previewState.value }
				</p>
			</div>
		</>
	);
}

/**
 * Reverse `disambiguateLabels()`: a picked-suggestion label resolves back
 * to its slug.
 *
 * @param {string} token   - Token from FormTokenField.
 * @param {Array}  options - { value, label } option list.
 * @return {string} Slug, or the original token (free-typed input is
 * sanitized later in `tokensToSlugs`).
 */
function labelFromTokenString( token, options ) {
	if ( ! Array.isArray( options ) ) {
		return token;
	}
	const match = options.find( option => option.label === token || option.value === token );
	return match ? match.value : token;
}

/**
 * Build the canvas preview's `{ label, value }` for the current mode +
 * selection. An empty selection renders "(none selected)" so the
 * unconfigured state stays explicit.
 *
 * @param {string}   mode        - 'include' | 'exclude'.
 * @param {string[]} postTypes   - Selected slug list.
 * @param {Map}      labelBySlug - slug → label.
 * @return {{label: string, value: string}} Preview row.
 */
function describePreview( mode, postTypes, labelBySlug ) {
	const valueText =
		postTypes.length > 0
			? postTypes.map( slug => labelBySlug.get( slug ) || slug ).join( ', ' )
			: __( '(none selected)', 'jetpack-search-pkg' );

	if ( mode === MODE_INCLUDE ) {
		return { label: __( 'Include only:', 'jetpack-search-pkg' ), value: valueText };
	}
	return { label: __( 'Exclude:', 'jetpack-search-pkg' ), value: valueText };
}

// Unit-test re-exports.
export { sanitizeKey, disambiguateLabels, tokensToSlugs, describePreview };
