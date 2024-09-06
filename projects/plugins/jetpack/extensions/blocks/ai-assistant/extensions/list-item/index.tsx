/**
 * Types
 */
import { BlockHandler } from '../block-handler';

export class ListItemHandler extends BlockHandler {
	constructor( clientId: string ) {
		super( clientId, [ 'listItem' ] );
		this.isChildBlock = true;
	}
}
