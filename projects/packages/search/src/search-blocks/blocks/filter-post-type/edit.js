/**
 * Editor preview for jetpack-search/filter-post-type.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { Icon, PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { unseen } from '@wordpress/icons';
import PostTypeScopeControl, {
	MODE_INCLUDE,
	MODE_EXCLUDE,
	disambiguateLabels,
} from '../../editor/post-type-control';

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

	// A second `getPostTypes` selector (the control runs its own) only to build
	// the slug→label map the canvas preview needs. `@wordpress/data` memoizes the
	// resolver, so this resolves to the same cached store entry — no extra fetch.
	const registeredTypes = useSelect(
		select => select( 'core' ).getPostTypes( { per_page: -1 } ),
		[]
	);
	const labelBySlug = useMemo( () => {
		const map = new Map();
		if ( Array.isArray( registeredTypes ) ) {
			disambiguateLabels(
				registeredTypes
					.filter( type => type?.slug && type.slug !== 'attachment' && type?.viewable !== false )
					.map( type => ( {
						value: type.slug,
						label: type?.labels?.singular_name || type?.name || type.slug,
					} ) )
			).forEach( option => map.set( option.value, option.label ) );
		}
		return map;
	}, [ registeredTypes ] );

	const previewState = describePreview( mode, postTypes, labelBySlug );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-search-pkg' ) }>
					<PostTypeScopeControl
						mode={ mode }
						postTypes={ postTypes }
						onChange={ ( { mode: nextMode, postTypes: nextPostTypes } ) =>
							setAttributes( { mode: nextMode, postTypes: nextPostTypes } )
						}
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
 * Build the canvas preview's `{ label, value }` for the current mode +
 * selection. An empty selection renders "(none selected)" so the
 * unconfigured state stays explicit.
 *
 * @param {string}   mode        - 'include' | 'exclude'.
 * @param {string[]} postTypes   - Selected slug list.
 * @param {Map}      labelBySlug - slug → label.
 * @return {{label: string, value: string}} Preview row.
 */
export function describePreview( mode, postTypes, labelBySlug ) {
	const valueText =
		postTypes.length > 0
			? postTypes.map( slug => labelBySlug.get( slug ) || slug ).join( ', ' )
			: __( '(none selected)', 'jetpack-search-pkg' );

	if ( mode === MODE_INCLUDE ) {
		return { label: __( 'Include only:', 'jetpack-search-pkg' ), value: valueText };
	}
	return { label: __( 'Exclude:', 'jetpack-search-pkg' ), value: valueText };
}
