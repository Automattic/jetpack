/**
 * External dependencies
 */
import TurndownService from 'turndown';
/**
 * Types
 */
import type { Options, Rule } from 'turndown';

const defaultTurndownOptions: Options = { emDelimiter: '_', headingStyle: 'atx' };
const defaultTurndownRules: { [ key: string ]: Rule } = {
	strikethrough: {
		filter: [ 'del', 's' ],
		replacement: function ( content: string ) {
			return '~~' + content + '~~';
		},
	},
};

export default class HTMLToMarkdown {
	turndownService: TurndownService;

	constructor(
		options: Options = defaultTurndownOptions,
		rules: { [ key: string ]: Rule } = defaultTurndownRules
	) {
		this.turndownService = new TurndownService( options );
		for ( const rule in rules ) {
			this.turndownService.addRule( rule, rules[ rule ] );
		}
	}

	/**
	 * Renders HTML from Markdown content with specified processing rules.
	 * @param {object} options         - The options to use when rendering the Markdown content
	 * @param {string} options.content - The HTML content to render
	 * @returns {string}                 The rendered Markdown content
	 */
	render( { content }: { content: string } ): string {
		return this.turndownService.turndown( content );
	}
}
