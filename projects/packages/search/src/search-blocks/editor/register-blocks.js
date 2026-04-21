/**
 * Editor-side registration for Jetpack Search blocks.
 *
 * Server-side block.json metadata is bootstrapped by WordPress via
 * wp.blocks.unstable__bootstrapServerSideBlockDefinitions(), but nothing
 * calls registerBlockType() for these dynamic blocks — so the editor sees
 * metadata without a block definition and renders the "Your site doesn't
 * include support for..." fallback. This file provides the minimal
 * client-side registration: each block previews with ServerSideRender so
 * what you see in the editor matches what render.php produces on the front
 * end.
 */
import { useBlockProps } from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';
import { createElement } from '@wordpress/element';
import ServerSideRender from '@wordpress/server-side-render';

const BLOCK_NAMES = [
	'jetpack/search-input',
	'jetpack/search-results',
	'jetpack/filter-checkbox',
	'jetpack/active-filters',
	'jetpack/sort-control',
	'jetpack/results-count',
	'jetpack/no-results',
	'jetpack/load-more',
];

/**
 * Build an Edit component that previews the given block via ServerSideRender.
 *
 * @param {string} name - Block type name.
 * @return {Function} Edit component.
 */
function makeEdit( name ) {
	return function Edit( { attributes } ) {
		const blockProps = useBlockProps();
		return createElement(
			'div',
			blockProps,
			createElement( ServerSideRender, {
				block: name,
				attributes,
			} )
		);
	};
}

BLOCK_NAMES.forEach( name => {
	registerBlockType( name, {
		edit: makeEdit( name ),
		save() {
			// Dynamic block — render.php produces all markup.
			return null;
		},
	} );
} );
