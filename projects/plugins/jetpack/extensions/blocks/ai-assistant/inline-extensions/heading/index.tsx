/**
 * Types
 */
import { BlockHandler } from '../block-handler';

export class HeadingHandler extends BlockHandler {
	constructor( clientId: string ) {
		super( clientId, [] );
	}

	public onSuggestion( suggestion: string ): void {
		const block = this.getBlock();

		// Adjust suggestion if it does not start with a hash.
		if ( ! suggestion.startsWith( '#' ) ) {
			suggestion = `${ '#'.repeat( ( block?.attributes?.level as number ) || 1 ) } ${ suggestion }`;
		}

		// Ignore an empty suggestion, that is, a suggestion that only contains hashes and spaces.
		if ( suggestion.match( /^#*\s*$/ ) ) {
			return;
		}

		const HTML = this.renderContent( suggestion );

		this.replaceBlockContent( HTML );
	}
}
