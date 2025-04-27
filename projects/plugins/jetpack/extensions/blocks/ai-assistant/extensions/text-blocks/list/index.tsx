/**
 * Types
 */
import { BlockHandler } from '../block-handler';

export class ListHandler extends BlockHandler {
	constructor( clientId: string ) {
		super( clientId, [ 'list' ] );
	}
}
