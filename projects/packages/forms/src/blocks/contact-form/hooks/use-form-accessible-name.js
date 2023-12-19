import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

const getNameFromBlockHeading = block => {
	const innerHeading = block.innerBlocks?.find( b => b.name === 'core/heading' );

	return innerHeading?.attributes?.content;
};

const getNameFromBlockPreviousHeadings = ( block, pageBlocks ) => {
	const blockIndex = pageBlocks.findIndex( b => b.clientId === block.clientId );
	const previousBlocks = pageBlocks.slice( 0, blockIndex );
	const closestHeading = previousBlocks.findLast( b => b.name === 'core/heading' );

	return closestHeading?.attributes?.content;
};

/**
 * Update the form accessible stored in the `formTitle` attribute as the block or page
 * content changes. The heuristic is as follows:
 * 1. Look for a heading inside the form
 * 2. Look for a heading in the previous siblings
 * 3. Use the post title (in Contact_Form::parse, server side)
 *
 * @param {string} formTitle - The form title
 * @param {string} clientId - The block unique identifier
 * @param {Function} setAttributes - Function to call to update one or more attributes
 */
export default function useFormAccessibleName( formTitle, clientId, setAttributes ) {
	const { pageBlocks } = useSelect( select => ( {
		pageBlocks: select( 'core/block-editor' ).getBlocks(),
	} ) );

	useEffect( () => {
		const currentBlock = pageBlocks.find( block => block.clientId === clientId );

		let name = '';

		if ( currentBlock ) {
			// #1
			name = getNameFromBlockHeading( currentBlock );

			if ( ! name ) {
				// #2
				name = getNameFromBlockPreviousHeadings( currentBlock, pageBlocks );
			}
		}

		if ( formTitle !== name ) {
			setAttributes( { formTitle: name } );
		}
	}, [ clientId, formTitle, setAttributes, pageBlocks ] );
}
