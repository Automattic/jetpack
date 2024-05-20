/**
 * External dependencies
 */
import TurndownService from 'turndown';
/**
 * Types
 */
import type { Options, Rule, Filter } from 'turndown';

export type Fix = 'paragraph';
type Fixes = {
	[ key in Fix ]: ( content: string ) => string;
};

const fixesList: Fixes = {
	paragraph: ( content: string ) => {
		// Keep <br> tags to prevent paragraphs from being split
		return content.replaceAll( '\n', '<br />' );
	},
};

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
	fixes: Fix[];

	constructor( {
		options = {},
		rules = {},
		keep = [],
		remove = [],
		fixes = [],
	}: {
		options?: Options;
		rules?: { [ key: string ]: Rule };
		keep?: Filter;
		remove?: Filter;
		fixes?: Fix[];
	} = {} ) {
		this.fixes = fixes;
		this.turndownService = new TurndownService( { ...defaultTurndownOptions, ...options } );
		this.turndownService.keep( keep );
		this.turndownService.remove( remove );

		const allRules = { ...defaultTurndownRules, ...rules };
		for ( const rule in allRules ) {
			this.turndownService.addRule( rule, allRules[ rule ] );
		}
	}

	/**
	 * Renders HTML from Markdown content with specified processing rules.
	 * @param {object} options         - The options to use when rendering the Markdown content
	 * @param {string} options.content - The HTML content to render
	 * @returns {string}                 The rendered Markdown content
	 */
	render( { content }: { content: string } ): string {
		const rendered = this.turndownService.turndown( content );

		return this.fixes.reduce( ( renderedContent, fix ) => {
			return fixesList[ fix ]( renderedContent );
		}, rendered );
	}
}
