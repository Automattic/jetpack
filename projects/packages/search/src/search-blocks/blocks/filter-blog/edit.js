/**
 * Editor preview for jetpack/filter-blog.
 *
 * Renders a sample radio list mirroring the front-end DOM shape. The list
 * the visitor sees is populated server-side from the `blogIdFilteringLabels`
 * option (resolved via the legacy `jetpack_instant_search_options` filter),
 * which isn't available in the editor — so the preview uses fixed mock data.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { createElement as h, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const SAMPLE_OPTIONS = [
	{ value: '1', label: __( 'Main Site', 'jetpack-search-pkg' ) },
	{ value: '2', label: __( 'Design Blog', 'jetpack-search-pkg' ) },
	{ value: '3', label: __( 'News', 'jetpack-search-pkg' ) },
];

const DEFAULT_LABEL = __( 'Blog', 'jetpack-search-pkg' );

/**
 * Edit component for the filter-blog block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function FilterBlogEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	const rawLabel = attributes?.label || '';
	const previewLabel = rawLabel || DEFAULT_LABEL;

	return h(
		Fragment,
		null,
		h(
			InspectorControls,
			null,
			h(
				PanelBody,
				{ title: __( 'Settings', 'jetpack-search-pkg' ) },
				h( TextControl, {
					__next40pxDefaultSize: true,
					__nextHasNoMarginBottom: true,
					label: __( 'Label', 'jetpack-search-pkg' ),
					value: rawLabel,
					placeholder: DEFAULT_LABEL,
					onChange: value => setAttributes( { label: value } ),
					help: __( 'Leave empty to use the default label ("Blog").', 'jetpack-search-pkg' ),
				} )
			)
		),
		h(
			'div',
			blockProps,
			h( 'h3', { className: 'jetpack-search-filter__title' }, previewLabel ),
			h(
				'ul',
				{ className: 'jetpack-search-filter__list' },
				SAMPLE_OPTIONS.map( option =>
					h(
						'li',
						{ key: option.value, className: 'jetpack-search-filter__item' },
						h(
							'label',
							null,
							h( 'input', {
								type: 'radio',
								name: 'jetpack-search-filter-blog-preview',
								disabled: true,
							} ),
							h( 'span', { className: 'jetpack-search-filter__label' }, option.label )
						)
					)
				)
			)
		)
	);
}
