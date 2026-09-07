/**
 * Post-type scope control for the editor.
 *
 * Renders the mode toggle (include / exclude) plus a slug picker, and owns the
 * slug normalization, label disambiguation, and per-mode draft cache. Consumed
 * by the `jetpack-search/search-results` block's "Search scope" inspector
 * panel.
 */
import { FormTokenField, RadioControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export const MODE_INCLUDE = 'include';
export const MODE_EXCLUDE = 'exclude';

/**
 * `sanitize_key()` (PHP) approximation: lowercase + strip everything that
 * is not `[a-z0-9_-]`. Mirrors the server normalizer so editor-stored
 * attributes match what eventually reaches ES.
 *
 * @param {string} value - Raw token string.
 * @return {string} Sanitized slug.
 */
export function sanitizeKey( value ) {
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
export function disambiguateLabels( options ) {
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
export function toTokens( slugs, labelBySlug ) {
	return ( slugs || [] ).map( slug => ( {
		value: slug,
		title: labelBySlug.get( slug ) || slug,
	} ) );
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
export function labelFromTokenString( token, options ) {
	if ( ! Array.isArray( options ) ) {
		return token;
	}
	const match = options.find( option => option.label === token || option.value === token );
	return match ? match.value : token;
}

/**
 * Convert FormTokenField output back to a sanitized, deduped slug list.
 * Free-typed values pass through `sanitizeKey` so editor and server agree.
 *
 * @param {Array<string|{value: string}>}         tokens  - Tokens from onChange.
 * @param {Array<{value: string, label: string}>} options - Resolved options for label→slug lookup.
 * @return {string[]} Sanitized slugs.
 */
export function tokensToSlugs( tokens, options ) {
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
 * Post-type scope control: a mode toggle plus a slug picker.
 *
 * Stateless on the outside — `mode` / `postTypes` come in as props and every
 * edit flows back through `onChange({ mode, postTypes })`. The per-mode draft
 * cache (so flipping back to a previously-used mode restores its typed list)
 * lives here because it's a UX property of the control, not of either host
 * block's attribute shape.
 *
 * @param {object}   props           - Control props.
 * @param {string}   props.mode      - 'include' | 'exclude'.
 * @param {string[]} props.postTypes - Selected slug list for the active mode.
 * @param {Function} props.onChange  - Called with `{ mode, postTypes }` on any edit.
 * @return {object} Rendered element.
 */
export default function PostTypeScopeControl( { mode, postTypes, onChange } ) {
	const activeMode = mode === MODE_INCLUDE ? MODE_INCLUDE : MODE_EXCLUDE;
	const slugs = useMemo( () => ( Array.isArray( postTypes ) ? postTypes : [] ), [ postTypes ] );

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

	// Per-mode draft cache. Flipping back to a previously-used mode restores
	// the typed list; only the active mode's selection is persisted upstream.
	const draftRef = useRef( null );
	if ( draftRef.current === null ) {
		draftRef.current = {
			[ MODE_INCLUDE ]: activeMode === MODE_INCLUDE ? slugs : [],
			[ MODE_EXCLUDE ]: activeMode === MODE_EXCLUDE ? slugs : [],
		};
	}

	const handleModeChange = nextMode => {
		if ( nextMode === activeMode ) {
			return;
		}
		draftRef.current = { ...draftRef.current, [ activeMode ]: slugs };
		onChange( { mode: nextMode, postTypes: draftRef.current[ nextMode ] || [] } );
	};

	const handlePostTypesChange = tokens => {
		const nextSlugs = tokensToSlugs( tokens, options );
		draftRef.current = { ...draftRef.current, [ activeMode ]: nextSlugs };
		onChange( { mode: activeMode, postTypes: nextSlugs } );
	};

	return (
		<>
			<RadioControl
				label={ __( 'Mode', 'jetpack-search-pkg' ) }
				selected={ activeMode }
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
					activeMode === MODE_INCLUDE
						? __( 'Post types to include', 'jetpack-search-pkg' )
						: __(
								'Post types to exclude',
								'jetpack-search-pkg',
								/* dummy arg so the minifier can't fold both branches into
								   `__( cond ? a : b )` — that yields a non-literal msgid and
								   fails the production i18n-string check. */ 0
						  )
				}
				value={ toTokens( slugs, labelBySlug ) }
				suggestions={ suggestionList }
				__experimentalExpandOnFocus
				__experimentalShowHowTo={ false }
				onChange={ handlePostTypesChange }
			/>
		</>
	);
}
