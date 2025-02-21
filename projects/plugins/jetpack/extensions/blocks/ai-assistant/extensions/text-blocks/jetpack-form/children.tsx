import { select, dispatch } from '@wordpress/data';
import { BlockHandler } from '../block-handler';
import { BlockEditorDispatch } from '../types';
export class JetpackChildrenFormHandler extends BlockHandler {
	jetpackFormBlockName = 'jetpack/contact-form';

	constructor( clientId: string ) {
		super( clientId, [] );
		this.behavior = this.handleBehavior;
		this.isChildBlock = true;
		this.hideOnBlockFocus = false;
	}

	handleBehavior = ( { context } ) => {
		const blockEditorDispatch = dispatch( 'core/block-editor' ) as BlockEditorDispatch;

		const { getBlockParentsByBlockName } = select( 'core/block-editor' ) as unknown as {
			getBlockParentsByBlockName: ( clientId: string, blockName: string ) => string[];
		};

		const jetpackFormClientId = getBlockParentsByBlockName(
			this.clientId,
			this.jetpackFormBlockName
		)?.[ 0 ];

		blockEditorDispatch.selectBlock( jetpackFormClientId );
		context?.[ this.jetpackFormBlockName ]?.handleAskAiAssistant?.();
	};
}
