import * as csstree from 'css-tree';

/**
 * Remove earlier identical rules in matching conditional contexts, keeping cascade order.
 *
 * @param {string} css - Minified CSS from all pruned source stylesheets.
 * @return {string} CSS without redundant rules.
 */
export function deduplicateCss( css: string ): string {
	const ast = csstree.parse( css ) as csstree.StyleSheet;
	const seen = new Set< string >();
	const registrations = new Set< string >();
	const groups = [
		'media',
		'supports',
		'container',
		'layer',
		'scope',
		'starting-style',
		'-moz-document',
	];

	const joinAdjacentGroups = ( children: csstree.List< csstree.CssNode > ) => {
		let previous: csstree.Atrule | null = null;
		children.forEach( ( node, item ) => {
			if (
				node.type !== 'Atrule' ||
				! node.block ||
				! groups.includes( node.name.toLowerCase() ) ||
				( node.name.toLowerCase() === 'layer' && ! node.prelude )
			) {
				previous = null;
				return;
			}
			if (
				previous &&
				previous.name === node.name &&
				( previous.prelude ? csstree.generate( previous.prelude ) : '' ) ===
					( node.prelude ? csstree.generate( node.prelude ) : '' )
			) {
				previous.block.children.appendList( node.block.children );
				children.remove( item );
			} else {
				previous = node;
			}
		} );
		children.forEach( node => {
			if ( node.type === 'Atrule' && node.block && groups.includes( node.name.toLowerCase() ) ) {
				joinAdjacentGroups( node.block.children );
			}
		} );
	};

	const registerLayers = (
		children: csstree.List< csstree.CssNode >,
		parent = '',
		context: string[] = [],
		namespaceHeader = false
	) => {
		children.forEach( ( node, item ) => {
			if ( node.type !== 'Atrule' ) {
				namespaceHeader = false;
				return;
			}
			const name = node.name.toLowerCase();
			if ( name === 'namespace' ) {
				// Preserve the valid namespace header; ignored later declarations must not become active.
				if ( ! namespaceHeader ) {
					children.remove( item );
				}
				return;
			}
			if ( ! [ 'charset', 'import' ].includes( name ) ) {
				namespaceHeader = false;
			}
			let layer = parent;
			if ( name === 'layer' ) {
				if ( ! node.prelude ) {
					return;
				}
				const names = csstree.generate( node.prelude ).split( ',' );
				const fresh = names.filter( entry => {
					const qualified = parent + entry;
					const key = JSON.stringify( [ ...context, qualified ] );
					if ( registrations.has( key ) ) {
						return false;
					}
					const parts = qualified.split( '.' );
					parts.forEach( ( _, i ) =>
						registrations.add(
							JSON.stringify( [ ...context, parts.slice( 0, i + 1 ).join( '.' ) ] )
						)
					);
					return true;
				} );
				if ( node.block ) {
					// Register layers where they first appeared even if their earlier rules disappear.
					if ( fresh.length ) {
						const statement = csstree.parse(
							'@layer ' + fresh.join( ',' ) + ';'
						) as csstree.StyleSheet;
						children.insertData( statement.children.first, item );
					}
					layer += names[ 0 ] + '.';
				} else if ( ! fresh.length ) {
					children.remove( item );
				}
			}
			if ( node.block ) {
				registerLayers(
					node.block.children,
					layer,
					name === 'layer'
						? context
						: [ ...context, name + ' ' + ( node.prelude ? csstree.generate( node.prelude ) : '' ) ]
				);
			}
		} );
	};

	const prune = ( children: csstree.List< csstree.CssNode >, context: string[] ) => {
		children.forEachRight( ( node, item ) => {
			if ( node.type === 'Atrule' ) {
				const name = node.name.toLowerCase();
				if ( [ 'namespace', 'import', 'charset' ].includes( name ) ) {
					return;
				}
				if ( name === 'layer' && ( ! node.block || ! node.prelude ) ) {
					return;
				}
				if ( groups.includes( name ) && node.block ) {
					prune( node.block.children, [
						...context,
						name + ' ' + ( node.prelude ? csstree.generate( node.prelude ) : '' ),
					] );
					if ( node.block.children.isEmpty ) {
						children.remove( item );
					}
					return;
				}
			}
			if (
				csstree.find(
					node,
					child => child !== node && child.type === 'Atrule' && child.name.toLowerCase() === 'layer'
				)
			) {
				return;
			}
			const key = JSON.stringify( [ ...context, csstree.generate( node ) ] );
			if ( seen.has( key ) ) {
				children.remove( item );
			} else {
				seen.add( key );
			}
		} );
	};

	const positionRegistrations = ( children: csstree.List< csstree.CssNode > ) => {
		let start: csstree.ListItem< csstree.CssNode > | null | undefined;
		children.forEach( ( node, item ) => {
			if ( start === undefined ) {
				start = item;
			}
			if ( node.type === 'Atrule' && node.name.toLowerCase() === 'layer' && ! node.block ) {
				if ( item !== start ) {
					children.remove( item );
					children.insert( item, start );
				} else {
					start = item.next;
				}
			} else if (
				csstree.find(
					node,
					child =>
						child.type === 'Atrule' &&
						[ 'layer', 'namespace', 'import' ].includes( child.name.toLowerCase() )
				)
			) {
				// Registration may cross ordinary rules, but never another registration or condition.
				start = item.next;
			}
			if ( node.type === 'Atrule' && node.block ) {
				positionRegistrations( node.block.children );
			}
		} );
	};

	// Run after minification so it cannot discard the layer registration statements we retain.
	joinAdjacentGroups( ast.children );
	registerLayers( ast.children, '', [], true );
	prune( ast.children, [] );
	positionRegistrations( ast.children );
	return csstree.generate( ast );
}
