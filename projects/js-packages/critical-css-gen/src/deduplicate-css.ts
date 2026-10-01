import * as csstree from 'css-tree';

/**
 * Remove earlier identical rules in matching conditional contexts, keeping cascade order.
 *
 * @param {string} css - Pruned CSS from all source stylesheets.
 * @return {string} CSS without redundant rules.
 */
export function deduplicateCss( css: string ): string {
	const ast = csstree.parse( css ) as csstree.StyleSheet;
	const seen = new Set< string >();

	const prune = ( children: csstree.List< csstree.CssNode >, context: string[] ) => {
		children.forEachRight( ( node, item ) => {
			if ( node.type === 'Rule' ) {
				let hasAtRules = false;
				csstree.walk( node, {
					visit: 'Atrule',
					enter: () => {
						hasAtRules = true;
					},
				} );
				if ( hasAtRules ) {
					seen.clear();
					return;
				}
			}
			if (
				node.type === 'Rule' ||
				( node.type === 'Atrule' &&
					[ 'font-face', 'custom-media' ].includes( node.name.toLowerCase() ) )
			) {
				const key = JSON.stringify( [ ...context, csstree.generate( node ) ] );
				if ( seen.has( key ) ) {
					children.remove( item );
				} else {
					seen.add( key );
				}
			} else if (
				node.type === 'Atrule' &&
				[ 'media', 'supports' ].includes( node.name.toLowerCase() ) &&
				node.block &&
				node.prelude
			) {
				prune( node.block.children, [
					...context,
					node.name.toLowerCase() + ' ' + csstree.generate( node.prelude ),
				] );
				if ( node.block.children.isEmpty ) {
					children.remove( item );
				}
			} else {
				// Layer registration and unfamiliar at-rules can make source position significant.
				seen.clear();
			}
		} );
	};

	prune( ast.children, [] );
	return csstree.generate( ast );
}
