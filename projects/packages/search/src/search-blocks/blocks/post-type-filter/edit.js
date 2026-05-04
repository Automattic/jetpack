/**
 * Editor preview for jetpack/post-type-filter.
 *
 * Hidden filter: the front-end render is empty by design — this block only
 * contributes a single-mode constraint (Include OR Exclude, never both) to
 * the shared search state. The editor preview is a small Placeholder card
 * so the editor can see and configure the block without it being invisible
 * in the canvas.
 *
 * Single-mode rather than two attribute lists: combining Include and
 * Exclude on one block is technically valid (Include narrows, Exclude
 * subtracts inside it), but it confuses authors — Exclude visibly does
 * "nothing" most of the time when Include is set, since the include set
 * is already restrictive. A toggle keeps the mental model simple: pick
 * one mode, then pick the post types that belong to it.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { FormTokenField, PanelBody, Placeholder, RadioControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const MODE_INCLUDE = 'include';
const MODE_EXCLUDE = 'exclude';

/**
 * sanitize_key() (PHP) approximation: lowercase + strip anything that is not
 * `[a-z0-9_-]`. Mirrors how the server normalizes attribute slugs so the
 * editor's stored attribute matches what eventually reaches ES.
 *
 * @param {string} value - Raw token string.
 * @return {string} Sanitized slug, or empty string when nothing remains.
 */
function sanitizeKey( value ) {
	return String( value || '' )
		.toLowerCase()
		.replace( /[^a-z0-9_-]+/g, '' );
}

/**
 * Build a unique-by-construction display label for each post type. When two
 * types share the same `singular_name` (a plugin can register an entirely
 * different CPT with the same human label as a built-in), append the slug
 * in parentheses so the FormTokenField suggestion list stays one-to-one
 * with the underlying slug.
 *
 * @param {Array<{value: string, label: string}>} options - Raw slug/label list.
 * @return {Array<{value: string, label: string}>} Same shape with disambiguated labels.
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
 * Map a list of post-type slugs to the labelled token shape FormTokenField
 * expects for displayed values, falling back to the raw slug when the type
 * isn't (yet) loaded by core-data.
 *
 * @param {string[]} slugs       - Stored slug list.
 * @param {Map}      labelBySlug - slug -> singular label map.
 * @return {Array<{ value: string, title: string }>} Token shape for FormTokenField.
 */
function toTokens( slugs, labelBySlug ) {
	return ( slugs || [] ).map( slug => ( {
		value: slug,
		title: labelBySlug.get( slug ) || slug,
	} ) );
}

/**
 * Convert FormTokenField output back into a sanitized slug list. Tokens
 * may come back as strings (free entry or label picked from suggestions)
 * or as `{ value }` objects; both resolve to the slug we store on the
 * attribute. Free-typed values pass through `sanitizeKey` so the saved
 * attribute matches what the server normalizer will produce.
 *
 * @param {Array<string|{value: string}>}         tokens  - Tokens emitted by onChange.
 * @param {Array<{value: string, label: string}>} options - Resolved post-type options for label→slug lookup.
 * @return {string[]} Deduped, non-empty, sanitize_key-equivalent slug list.
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
 * Edit component for the post-type-filter block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function PostTypeFilterEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	const mode = attributes?.mode === MODE_INCLUDE ? MODE_INCLUDE : MODE_EXCLUDE;
	const postTypes = useMemo(
		() => ( Array.isArray( attributes?.postTypes ) ? attributes.postTypes : [] ),
		[ attributes?.postTypes ]
	);

	// `getPostTypes()` proxies getEntityRecords( 'root', 'postType' ); it
	// returns null until resolved and a finite list once loaded. We further
	// drop `attachment` and any type whose `viewable` flag is `false` here;
	// the *server* normalizer (`Post_Type_Filter::build_constraint()`) is
	// the canonical allowlist gate against `exclude_from_search => false`.
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
						onChange={ value => {
							// Clear the slug list when switching modes so the
							// previously-typed list can not silently flip
							// meaning (an "exclude these" list becoming an
							// "include only these" list is a footgun).
							setAttributes( { mode: value, postTypes: [] } );
						} }
					/>
					<FormTokenField
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={
							mode === MODE_INCLUDE
								? __( 'Post types to include', 'jetpack-search-pkg' )
								: __( 'Post types to exclude', 'jetpack-search-pkg' )
						}
						value={ toTokens( postTypes, labelBySlug ) }
						suggestions={ suggestionList }
						__experimentalExpandOnFocus
						__experimentalShowHowTo={ false }
						onChange={ tokens => setAttributes( { postTypes: tokensToSlugs( tokens, options ) } ) }
					/>
					<p
						className="jetpack-search-post-type-filter__hint"
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
				<Placeholder label={ __( 'Post Type Scope', 'jetpack-search-pkg' ) }>
					<p style={ { margin: 0 } }>
						<strong>{ previewState.label }</strong> { previewState.value }
					</p>
				</Placeholder>
			</div>
		</>
	);
}

/**
 * Translate a label string emitted by FormTokenField back to the matching
 * post-type slug. Labels are disambiguated upstream by `disambiguateLabels()`,
 * so each label in `options` resolves to exactly one slug.
 *
 * @param {string} token   - Token string from FormTokenField.
 * @param {Array}  options - { value, label } option list.
 * @return {string} Slug, or the original token if no match. Free-typed input is
 * left untouched here; `tokensToSlugs` runs it through `sanitizeKey` before saving.
 */
function labelFromTokenString( token, options ) {
	if ( ! Array.isArray( options ) ) {
		return token;
	}
	const match = options.find( option => option.label === token || option.value === token );
	return match ? match.value : token;
}

/**
 * Build the canvas preview copy for the current mode + selection. Returns a
 * `{ label, value }` pair that the JSX renders as `<strong>{label}</strong> {value}`.
 *
 * Mode-specific labels keep the canvas text aligned with the Inspector
 * (Include/Exclude) instead of restating "Results limited to..."  copy that
 * has to be re-read every time. Empty selections render a clear "(none
 * selected)" so the unconfigured state is unambiguous.
 *
 * @param {string}   mode        - 'include' | 'exclude'.
 * @param {string[]} postTypes   - Selected slug list.
 * @param {Map}      labelBySlug - slug -> label map.
 * @return {{label: string, value: string}} Preview rows.
 */
function describePreview( mode, postTypes, labelBySlug ) {
	const valueText =
		postTypes.length > 0
			? postTypes.map( slug => labelBySlug.get( slug ) || slug ).join( ', ' )
			: __( '(none selected)', 'jetpack-search-pkg' );

	if ( mode === MODE_INCLUDE ) {
		return {
			label: __( 'Include only:', 'jetpack-search-pkg' ),
			value: valueText,
		};
	}
	return {
		label: __( 'Exclude:', 'jetpack-search-pkg' ),
		value: valueText,
	};
}

// Re-export internals for unit tests.
export { sanitizeKey, disambiguateLabels, tokensToSlugs, describePreview };
