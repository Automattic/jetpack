function getBlacklistUrlsPattern() {
	const blackList = [
		'([^ ]*\.)?wordpress.com',
		'([^ ]*\.)?jetpack.com',
		'([^ ]*\.)?vaultpress.com',
		'([^ ]*\.)?akismet.com',
		'([^ ]*\.)?tumblr.com',
		'([^ ]*\.)?videopress.com',
		'([^ ]*\.)?wordpress.org',
	];

	const domains = blackList.join( '|' );

	return new RegExp( `https?:\/\/(${ domains })` );

}

module.exports.rules = {
	"jetpack-redirects": context => (
		{
			TemplateLiteral: (node) => {

				node.quasis.forEach( element => {
					if ( 'string' === typeof( element.value.raw ) && element.value.raw.length && element.value.raw.search( getBlacklistUrlsPattern() ) >= 0 ) {
						const parent = node.parent;
						if ( 'CallExpression' === parent.type && parent.callee && parent.callee.name && 'getRedirectUrl' === parent.callee.name ) {
							return;
						}
						context.report(node, 'Links to a8c domains must be added using the jetpack redirects package');
					}
				} );

			},

			Literal: (node) => {

				if ( 'string' === typeof( node.value ) && node.value.length && node.value.search( getBlacklistUrlsPattern() ) >= 0 ) {
					const parent = node.parent;
					if ( 'CallExpression' === parent.type && parent.callee && parent.callee.name && 'getRedirectUrl' === parent.callee.name ) {
						return;
					}
					context.report(node, 'Links to a8c domains must be added using the jetpack redirects package');
				}

			}
		}
	)
};
