import { BlockHandler } from '../block-handler';

export class JetpackChildrenFormHandler extends BlockHandler {
	constructor( clientId: string ) {
		super( clientId, [], 'action' );
	}
}
