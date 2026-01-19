/**
 * Handle form selection by setting the ref attribute and selecting the block.
 *
 * @param {object}                  params               - Parameters object.
 * @param {string}                  params.formId        - The selected form ID.
 * @param {(fn:Function)=>void}     params.batch         - Function to batch changes.
 * @param {(attrs:Object)=>void}    params.setAttributes - Setter for block attributes.
 * @param {(clientId:string)=>void} params.selectBlock   - Selector for the target block.
 * @param {string}                  params.clientId      - Target block clientId.
 */
export function handleFormSelection( { formId, batch, setAttributes, selectBlock, clientId } ) {
	if ( ! formId ) {
		return;
	}

	batch( () => {
		setAttributes( { ref: parseInt( formId, 10 ) } );
		selectBlock( clientId );
	} );
}

export default handleFormSelection;
