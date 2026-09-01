/**
 * Apply a block variation by setting attributes, replacing inner blocks,
 * and selecting the target block. This function is dependency-injected to
 * make it easy to unit test with simple mocks.
 *
 * @param {object}                                params                          - Parameters object for applying the variation.
 * @param {(fn:Function)=>void}                   params.batch                    - Function to batch changes (e.g. registry.batch).
 * @param {(attrs:Object)=>void}                  params.setAttributes            - Setter for block attributes.
 * @param {(clientId:string, blocks:Array)=>void} params.replaceInnerBlocks       - Replacer for inner blocks.
 * @param {(clientId:string)=>void}               params.selectBlock              - Selector for the target block.
 * @param {string}                                params.clientId                 - Target block clientId.
 * @param {object}                                params.variation                - Variation containing attributes/innerBlocks.
 * @param {(template:Array)=>Array}               params.createBlocksFromTemplate - Function to create blocks from template.
 */
export function applyVariationToFormBlock( {
	batch,
	setAttributes,
	replaceInnerBlocks,
	selectBlock,
	clientId,
	variation,
	createBlocksFromTemplate,
} ) {
	batch( () => {
		if ( variation?.attributes ) {
			setAttributes( variation.attributes );
		}
		if ( variation?.innerBlocks ) {
			replaceInnerBlocks( clientId, createBlocksFromTemplate( variation.innerBlocks ) );
		}
		selectBlock( clientId );
	} );
}

export default applyVariationToFormBlock;
