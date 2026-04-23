/**
 * Editor preview for jetpack/no-results.
 *
 * The front end hides this block when results are present; the editor always
 * shows it so designers can style it.
 */
import { useBlockProps } from '@wordpress/block-editor';
import { createElement as h } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Edit component for the no-results block.
 *
 * @param {object} props            - Block props.
 * @param {object} props.attributes - Saved block attributes.
 * @return {object} Rendered element.
 */
export default function NoResultsEdit( { attributes } ) {
	const blockProps = useBlockProps();
	const message =
		attributes?.message || __( 'No results found. Try a different search.', 'jetpack-search-pkg' );
	return h( 'div', blockProps, h( 'p', null, message ) );
}
