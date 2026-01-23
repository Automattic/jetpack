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
		const numericFormId = parseInt( formId, 10 );

		if ( Number.isNaN( numericFormId ) ) {
			return;
		}
		setAttributes( { ref: numericFormId } );
		selectBlock( clientId );
	} );
}

export default handleFormSelection;
