/**
 * Editor preview for jetpack/post-type-filter.
 *
 * Hidden filter: the front-end render is empty by design — this block only
 * contributes an include/exclude constraint to the shared search state. The
 * editor preview is a small Placeholder card so the editor can see and
 * configure the block without it being invisible in the canvas.
 *
 * The Inspector exposes two FormTokenField pickers — Include and Exclude —
 * populated from registered post types via core-data. When a slug appears in
 * both lists the include side wins and we visually flag the conflict; the
 * server normalizer drops the duplicate from the exclude list before it
 * reaches the ES filter clause.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { FormTokenField, PanelBody, Placeholder } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * sanitize_key() (PHP) approximation: lowercase + strip anything that is not
 * `[a-z0-9_]`. Mirrors how the server normalizes attribute slugs so the
 * editor's stored attribute matches what eventually reaches ES.
 *
 * Hyphens — common in CPT slugs (`jetpack-portfolio`) — are preserved
 * (sanitize_key allows them too).
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
 * with the underlying slug. Without this the label→slug round-trip in
 * `labelFromTokenString()` would silently always pick the first match.
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
 * Convert the FormTokenField output back into a sanitized slug list. Tokens
 * may come back as strings (free entry or, in our setup, a label picked
 * from suggestions) or as `{ value }` objects; both resolve to the slug we
 * store on the attribute. Free-typed values are passed through `sanitizeKey`
 * so the saved attribute matches what the server normalizer will produce —
 * otherwise a typed `"Post"` and a typed `"post"` would both end up sent to
 * ES as `post` while the editor saw them as distinct entries.
 *
 * @param {Array<string|{value: string}>}         tokens  - Tokens emitted by onChange.
 * @param {Array<{value: string, label: string}>} options - Resolved post-type options for label→slug lookup.
 * @return {string[]} Deduped, non-empty, sanitize_key-equivalent slug list.
 */
function tokensToSlugs( tokens, options ) {
	const out = [];
	for ( const token of tokens || [] ) {
		// Strings come from FormTokenField when the user picks a suggestion
		// or types freely; objects only show up when we round-trip our own
		// `{value, title}` shape from `toTokens()`.
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
	// Memoize the array reads: a fresh `[]` on each render would otherwise
	// invalidate every downstream useMemo that lists these as dependencies.
	const include = useMemo(
		() => ( Array.isArray( attributes?.include ) ? attributes.include : [] ),
		[ attributes?.include ]
	);
	const exclude = useMemo(
		() => ( Array.isArray( attributes?.exclude ) ? attributes.exclude : [] ),
		[ attributes?.exclude ]
	);

	// `getPostTypes()` proxies getEntityRecords( 'root', 'postType' ); it
	// returns null until resolved and a finite list once loaded. We further
	// drop `attachment` and any type whose `viewable` flag is `false` here.
	// We can't filter by `exclude_from_search` from JS — the REST endpoint
	// does not expose that flag — so the *server* normalizer
	// (`Post_Type_Filter::build_lists()`) is the canonical allowlist gate.
	// The editor list may include a few search-excluded types; saving them
	// is harmless because they'll be dropped on render.
	const postTypes = useSelect( select => select( 'core' ).getPostTypes( { per_page: -1 } ), [] );

	const options = useMemo( () => {
		if ( ! Array.isArray( postTypes ) ) {
			return null;
		}
		return disambiguateLabels(
			postTypes
				.filter( type => type?.slug && type.slug !== 'attachment' && type?.viewable !== false )
				.map( type => ( {
					value: type.slug,
					label: type?.labels?.singular_name || type?.name || type.slug,
				} ) )
		);
	}, [ postTypes ] );

	const labelBySlug = useMemo( () => {
		const map = new Map();
		( options || [] ).forEach( option => map.set( option.value, option.label ) );
		return map;
	}, [ options ] );

	const suggestionList = useMemo(
		() => ( options || [] ).map( option => option.label ),
		[ options ]
	);

	const onChangeList = key => tokens => {
		setAttributes( { [ key ]: tokensToSlugs( tokens, options ) } );
	};

	// Compare via `sanitizeKey` so case/punctuation differences that the
	// server normalizer collapses to the same slug also flag here. Without
	// this, `Post` in Include and `post` in Exclude would not surface a
	// conflict in the editor even though the server drops one of them.
	const conflictingSlugs = useMemo( () => {
		const includeNorm = new Set( include.map( sanitizeKey ).filter( Boolean ) );
		return exclude.map( sanitizeKey ).filter( slug => slug && includeNorm.has( slug ) );
	}, [ include, exclude ] );

	const conflictingLabels = useMemo(
		() => conflictingSlugs.map( slug => labelBySlug.get( slug ) || slug ),
		[ conflictingSlugs, labelBySlug ]
	);

	const previewText = describePreview( include, exclude, labelBySlug );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-search-pkg' ) }>
					<FormTokenField
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Include only these post types', 'jetpack-search-pkg' ) }
						value={ toTokens( include, labelBySlug ) }
						suggestions={ suggestionList }
						__experimentalExpandOnFocus
						__experimentalShowHowTo={ false }
						onChange={ onChangeList( 'include' ) }
					/>
					<FormTokenField
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Exclude these post types', 'jetpack-search-pkg' ) }
						value={ toTokens( exclude, labelBySlug ) }
						suggestions={ suggestionList }
						__experimentalExpandOnFocus
						__experimentalShowHowTo={ false }
						onChange={ onChangeList( 'exclude' ) }
					/>
					{ conflictingLabels.length > 0 && (
						<p
							className="jetpack-search-post-type-filter__conflict"
							style={ {
								// Inline because the editor build pipeline has no CSS
								// loader — see tools/webpack.blocks-editor.config.js. The
								// warning tone (matches WP admin notice color #d63638)
								// lifts the conflict notice off the picker stack so
								// authors see it before saving.
								color: '#d63638',
								fontSize: '12px',
								marginTop: '8px',
								marginBottom: 0,
							} }
						>
							{ sprintf(
								/* translators: %s: comma-separated list of post-type labels appearing in both Include and Exclude. */
								__(
									'These post types are listed in both Include and Exclude — Include wins, the duplicate is dropped from Exclude: %s',
									'jetpack-search-pkg'
								),
								conflictingLabels.join( ', ' )
							) }
						</p>
					) }
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
				<Placeholder
					icon="filter"
					label={ __( 'Post Type Scope', 'jetpack-search-pkg' ) }
					instructions={ previewText }
				/>
			</div>
		</>
	);
}

/**
 * Translate a label string emitted by FormTokenField back to the matching
 * post-type slug. FormTokenField returns the label rather than the slug
 * because we feed it labels in the suggestions array; this is the inverse
 * lookup so attributes stay slug-keyed.
 *
 * Labels are disambiguated upstream by `disambiguateLabels()`, so each label
 * in `options` resolves to exactly one slug — `Array.find()` is unambiguous
 * even when two CPTs share a `singular_name`.
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
 * Build the human-readable summary line for the editor preview card. Always
 * renders labels (via `labelBySlug`) rather than raw slugs so the canvas
 * preview matches the FormTokenField token display in the Inspector.
 *
 * @param {string[]} include     - Include list.
 * @param {string[]} exclude     - Exclude list.
 * @param {Map}      labelBySlug - slug -> label map.
 * @return {string} Summary text.
 */
function describePreview( include, exclude, labelBySlug ) {
	const formatList = list => list.map( slug => labelBySlug.get( slug ) || slug ).join( ', ' );

	if ( include.length === 0 && exclude.length === 0 ) {
		return __(
			'No constraint configured. Add post types to Include or Exclude in the block settings.',
			'jetpack-search-pkg'
		);
	}
	if ( include.length > 0 && exclude.length === 0 ) {
		return sprintf(
			/* translators: %s: comma-separated list of post-type labels. */
			__( 'Results limited to: %s', 'jetpack-search-pkg' ),
			formatList( include )
		);
	}
	if ( include.length === 0 && exclude.length > 0 ) {
		return sprintf(
			/* translators: %s: comma-separated list of post-type labels. */
			__( 'Results exclude: %s', 'jetpack-search-pkg' ),
			formatList( exclude )
		);
	}
	return sprintf(
		/* translators: 1: include list, 2: exclude list. */
		__( 'Results limited to: %1$s · Excluding: %2$s', 'jetpack-search-pkg' ),
		formatList( include ),
		formatList( exclude )
	);
}

// Re-export internals for unit tests (jest's module-cache picks them up via
// `import * as`).
export { sanitizeKey, disambiguateLabels, tokensToSlugs, describePreview };
