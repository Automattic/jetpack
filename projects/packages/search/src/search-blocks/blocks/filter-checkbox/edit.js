/**
 * Editor preview for jetpack/filter-checkbox.
 *
 * Shows a labeled list of sample checkbox options mirroring the runtime DOM
 * shape so designers can style the filter list in place.
 */
import { useBlockProps } from '@wordpress/block-editor';
import { createElement as h } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const SAMPLE_FILTER_ITEMS = [
	{ value: 'one', label: __( 'First option', 'jetpack-search-pkg' ), count: 24 },
	{ value: 'two', label: __( 'Second option', 'jetpack-search-pkg' ), count: 12 },
	{ value: 'three', label: __( 'Third option', 'jetpack-search-pkg' ), count: 7 },
];

/**
 * Edit component for the filter-checkbox block.
 *
 * @param {object} props            - Block props.
 * @param {object} props.attributes - Saved block attributes.
 * @return {object} Rendered element.
 */
export default function FilterCheckboxEdit( { attributes } ) {
	const blockProps = useBlockProps();
	const label = attributes?.label || __( 'Filter', 'jetpack-search-pkg' );
	const showCount = attributes?.showCount !== false;
	return h(
		'div',
		blockProps,
		h( 'h3', { className: 'jetpack-search-filter__title' }, label ),
		h(
			'ul',
			{ className: 'jetpack-search-filter__list' },
			SAMPLE_FILTER_ITEMS.map( item =>
				h(
					'li',
					{ key: item.value, className: 'jetpack-search-filter__item' },
					h(
						'label',
						null,
						h( 'input', { type: 'checkbox', disabled: true } ),
						h( 'span', { className: 'jetpack-search-filter__label' }, item.label ),
						showCount
							? h( 'span', { className: 'jetpack-search-filter__count' }, String( item.count ) )
							: null
					)
				)
			)
		)
	);
}
