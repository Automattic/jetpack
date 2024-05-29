import { select, dispatch } from '@wordpress/data';
import { BlockHandler } from '../block-handler';
import { BlockEditorDispatch } from '../types';
export class JetpackChildrenFormHandler extends BlockHandler {
	constructor( clientId: string ) {
		super( clientId, [], null );
		this.behavior = this.handleBehavior;
	}

	handleBehavior = ( { onAskAiAssistant } ) => {
		const blockEditorDispatch = dispatch( 'core/block-editor' ) as BlockEditorDispatch;

		const { getBlockParentsByBlockName } = select( 'core/block-editor' ) as unknown as {
			getBlockParentsByBlockName: ( clientId: string, blockName: string ) => string[];
		};

		const jetpackFormClientId = getBlockParentsByBlockName(
			this.clientId,
			'jetpack/contact-form'
		)?.[ 0 ];

		blockEditorDispatch.selectBlock( jetpackFormClientId );
		onAskAiAssistant();
	};
}
