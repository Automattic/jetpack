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
import { Fragment, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

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
 * may come back as strings (free entry) or as `{ value }` objects (suggestion
 * pick); both resolve to the slug we store on the attribute.
 *
 * @param {Array<string|{value: string}>} tokens - Tokens emitted by onChange.
 * @return {string[]} Deduped, non-empty slug list.
 */
function tokensToSlugs( tokens ) {
	const out = [];
	for ( const token of tokens || [] ) {
		const slug = typeof token === 'string' ? token : token?.value || '';
		const trimmed = slug.trim();
		if ( trimmed && ! out.includes( trimmed ) ) {
			out.push( trimmed );
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
	// returns null until resolved and a finite list once loaded. The result
	// already excludes private / non-public types in the default REST view,
	// so we only need to filter out `attachment` and any type that opts out
	// of search to match the aggregation surface.
	const postTypes = useSelect( select => select( 'core' ).getPostTypes( { per_page: -1 } ), [] );

	const options = useMemo( () => {
		if ( ! Array.isArray( postTypes ) ) {
			return null;
		}
		return postTypes
			.filter( type => type?.slug && type.slug !== 'attachment' && type?.viewable !== false )
			.map( type => ( {
				value: type.slug,
				label: type?.labels?.singular_name || type?.name || type.slug,
			} ) );
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
		const slugs = tokensToSlugs(
			tokens.map( token => {
				// FormTokenField emits the suggestion *label* on pick (because we
				// pass labels in `suggestions`). Translate that label back to the
				// canonical slug so the attribute stores stable values.
				const slug =
					typeof token === 'string' ? labelFromTokenString( token, options ) : token?.value;
				return slug || token;
			} )
		);
		setAttributes( { [ key ]: slugs } );
	};

	const conflictingSlugs = useMemo(
		() => include.filter( slug => exclude.includes( slug ) ),
		[ include, exclude ]
	);

	const previewText = describePreview( include, exclude, labelBySlug );

	return (
		<Fragment>
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
					{ conflictingSlugs.length > 0 && (
						<p className="jetpack-search-post-type-filter__conflict">
							{ sprintf(
								/* translators: %s: comma-separated list of conflicting post-type slugs. */
								__(
									'These post types are listed in both Include and Exclude — Include wins, the duplicate is dropped from Exclude: %s',
									'jetpack-search-pkg'
								),
								conflictingSlugs.join( ', ' )
							) }
						</p>
					) }
					<p className="jetpack-search-post-type-filter__hint">
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
		</Fragment>
	);
}

/**
 * Translate a label string emitted by FormTokenField back to the matching
 * post-type slug. FormTokenField returns the label rather than the slug
 * because we feed it labels in the suggestions array; this is the inverse
 * lookup so attributes stay slug-keyed.
 *
 * @param {string} token   - Token string from FormTokenField.
 * @param {Array}  options - { value, label } option list.
 * @return {string} Slug, or the original token if no match.
 */
function labelFromTokenString( token, options ) {
	if ( ! Array.isArray( options ) ) {
		return token;
	}
	const match = options.find( option => option.label === token || option.value === token );
	return match ? match.value : token;
}

/**
 * Build the human-readable summary line for the editor preview card.
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
