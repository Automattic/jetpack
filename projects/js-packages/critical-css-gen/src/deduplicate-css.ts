import * as csstree from 'css-tree';

/**
 * Remove earlier identical rules in matching conditional contexts, keeping cascade order.
 *
 * @param {string} css - Minified CSS from all pruned source stylesheets.
 * @return {string} CSS without redundant rules.
 */
export function deduplicateCss( css: string ): string {
	const ast = csstree.parse( css ) as csstree.StyleSheet;
	const seen = new Map< number, Set< string > >();
	const registrations = new Map< number, Set< number > >();
	const contexts = new Map< number, Map< string, number > >();
	const layers = new Map< number, Map< string, number > >();
	const preludes = new WeakMap< csstree.Atrule, string >();
	let nextId = 1;
	const intern = ( tree: Map< number, Map< string, number > >, parent: number, key: string ) => {
		if ( ! tree.has( parent ) ) {
			tree.set( parent, new Map() );
		}
		const children = tree.get( parent )!;
		if ( ! children.has( key ) ) {
			children.set( key, nextId++ );
		}
		return children.get( key )!;
	};
	const nameOf = ( node: csstree.Atrule ) => csstree.ident.decode( node.name ).toLowerCase();
	const preludeOf = ( node: csstree.Atrule ) => {
		if ( ! preludes.has( node ) ) {
			preludes.set( node, node.prelude ? csstree.generate( node.prelude ) : '' );
		}
		return preludes.get( node )!;
	};
	const contextOf = ( parent: number, node: csstree.Atrule ) =>
		intern( contexts, parent, nameOf( node ) + ' ' + preludeOf( node ) );
	const layerNames = ( text: string ) => {
		const names: { text: string; parts: string[] }[] = [];
		let start = 0;
		let parts: string[] = [];
		// css-tree exports its tokenizer, but the published TypeScript types omit it.
		const tokenizer = csstree as typeof csstree & {
			tokenize: (
				input: string,
				callback: ( type: number, start: number, end: number ) => void
			) => void;
			tokenTypes: { Ident: number; Comma: number };
		};
		tokenizer.tokenize( text, ( type, offset, end ) => {
			if ( type === tokenizer.tokenTypes.Ident ) {
				parts.push( csstree.ident.decode( text.slice( offset, end ) ) );
			} else if ( type === tokenizer.tokenTypes.Comma ) {
				names.push( { text: text.slice( start, offset ).trim(), parts } );
				start = end;
				parts = [];
			}
		} );
		names.push( { text: text.slice( start ).trim(), parts } );
		return names;
	};
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
				! groups.includes( nameOf( node ) ) ||
				( nameOf( node ) === 'layer' && ! node.prelude )
			) {
				previous = null;
				return;
			}
			if (
				previous &&
				nameOf( previous ) === nameOf( node ) &&
				preludeOf( previous ) === preludeOf( node )
			) {
				previous.block.children.appendList( node.block.children );
				children.remove( item );
			} else {
				previous = node;
			}
		} );
		children.forEach( node => {
			if ( node.type === 'Atrule' && node.block && groups.includes( nameOf( node ) ) ) {
				joinAdjacentGroups( node.block.children );
			}
		} );
	};

	const registerLayers = (
		children: csstree.List< csstree.CssNode >,
		parent = 0,
		context = 0,
		namespaceHeader = false
	) => {
		children.forEach( ( node, item ) => {
			if ( node.type !== 'Atrule' ) {
				namespaceHeader = false;
				return;
			}
			const name = nameOf( node );
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
				const names = layerNames( preludeOf( node ) );
				if ( ( node.block && names.length !== 1 ) || names.some( entry => ! entry.parts.length ) ) {
					return;
				}
				if ( ! registrations.has( context ) ) {
					registrations.set( context, new Set() );
				}
				const registered = registrations.get( context )!;
				const fresh = names.filter( entry => {
					let qualified = parent;
					let isFresh = false;
					for ( const part of entry.parts ) {
						qualified = intern( layers, qualified, part );
						isFresh = ! registered.has( qualified );
						registered.add( qualified );
					}
					return isFresh;
				} );
				if ( node.block ) {
					// Register layers where they first appeared even if their earlier rules disappear.
					if ( fresh.length ) {
						const statement = csstree.parse(
							'@layer ' + fresh.map( entry => entry.text ).join( ',' ) + ';'
						) as csstree.StyleSheet;
						children.insertData( statement.children.first, item );
					}
					for ( const part of names[ 0 ].parts ) {
						layer = intern( layers, layer, part );
					}
				} else if ( ! fresh.length ) {
					children.remove( item );
				}
			}
			if ( node.block ) {
				registerLayers(
					node.block.children,
					layer,
					name === 'layer' ? context : contextOf( context, node )
				);
			}
		} );
	};

	const prune = ( children: csstree.List< csstree.CssNode >, context: number ) => {
		children.forEachRight( ( node, item ) => {
			if ( node.type === 'Atrule' ) {
				const name = nameOf( node );
				if ( [ 'namespace', 'import', 'charset' ].includes( name ) ) {
					return;
				}
				if ( name === 'layer' && ( ! node.block || ! node.prelude ) ) {
					return;
				}
				if ( groups.includes( name ) && node.block ) {
					prune( node.block.children, contextOf( context, node ) );
					if ( node.block.children.isEmpty ) {
						children.remove( item );
					}
					return;
				}
			}
			if (
				csstree.find(
					node,
					child => child !== node && child.type === 'Atrule' && nameOf( child ) === 'layer'
				)
			) {
				return;
			}
			if ( ! seen.has( context ) ) {
				seen.set( context, new Set() );
			}
			const rules = seen.get( context )!;
			const key = csstree.generate( node );
			if ( rules.has( key ) ) {
				children.remove( item );
			} else {
				rules.add( key );
			}
		} );
	};

	const positionRegistrations = ( children: csstree.List< csstree.CssNode > ) => {
		let start: csstree.ListItem< csstree.CssNode > | null | undefined;
		children.forEach( ( node, item ) => {
			if ( start === undefined ) {
				start = item;
			}
			if ( node.type === 'Atrule' && nameOf( node ) === 'layer' && ! node.block ) {
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
						[ 'layer', 'namespace', 'import' ].includes( nameOf( child ) )
				)
			) {
				// Do not cross layer registrations or conditions containing order-sensitive declarations.
				start = item.next;
			}
			if ( node.type === 'Atrule' && node.block ) {
				positionRegistrations( node.block.children );
			}
		} );
	};

	// Run after minification so it cannot discard the layer registration statements we retain.
	joinAdjacentGroups( ast.children );
	registerLayers( ast.children, 0, 0, true );
	prune( ast.children, 0 );
	positionRegistrations( ast.children );
	return csstree.generate( ast );
}
