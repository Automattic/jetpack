/**
 * External dependencies
 */
import TurndownService from 'turndown';

const turndownService = new TurndownService( { emDelimiter: '_', headingStyle: 'atx' } );
turndownService.addRule( 'strikethrough', {
	filter: [ 'del', 's', 'strike' ],
	replacement: function ( content ) {
		return '~~' + content + '~~';
	},
} );

export default turndownService;
