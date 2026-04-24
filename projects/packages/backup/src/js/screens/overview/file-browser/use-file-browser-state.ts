/* eslint-disable jsdoc/require-description, jsdoc/require-returns */

// Verbatim port of Calypso's `use-file-browser-state.ts`. Holds an
// in-memory tree keyed by rewindId inside a `useRef<Map>` so navigating
// between backups keeps each backup's selection intact. Check / uncheck
// propagates to children; indeterminate ("mixed") bubbles to parents.

import { useState, useCallback, useRef } from '@wordpress/element';
import type {
	FileBrowserCheckState,
	FileBrowserCheckListInfo,
	FileBrowserItem,
	FileBrowserNode,
	FileBrowserNodeCheckList,
	FileBrowserNodeType,
	FileBrowserState,
	FileBrowserStateActions,
} from '../../../data/types';

const createInitialState = (): FileBrowserState => ( {
	rootNode: {
		id: '',
		path: '/',
		type: 'dir',
		ancestors: [],
		checkState: 'unchecked',
		childrenLoaded: false,
		children: [],
		totalItems: 0,
	},
} );

/**
 *
 */
export function useFileBrowserState(): FileBrowserStateActions {
	const stateMapRef = useRef< Map< number, FileBrowserState > >( new Map() );

	const [ , forceUpdate ] = useState( {} );
	const triggerUpdate = useCallback( () => forceUpdate( {} ), [] );

	const getStateForRewindId = useCallback( ( rewindId: number ): FileBrowserState => {
		if ( ! stateMapRef.current.has( rewindId ) ) {
			stateMapRef.current.set( rewindId, createInitialState() );
		}
		return stateMapRef.current.get( rewindId )!;
	}, [] );

	const getNodeFromState = useCallback(
		( currentState: FileBrowserState, fullPath: string[] | string ): FileBrowserNode | null => {
			let currentNode = currentState.rootNode;

			if ( fullPath.length === 0 ) {
				return null;
			}

			if ( typeof fullPath === 'string' ) {
				fullPath = fullPath.split( '/' );
				fullPath = fullPath.filter( pathPart => pathPart.length > 0 );
			}

			if ( fullPath.length > 0 && fullPath[ 0 ] === '/' ) {
				fullPath.shift();
			}

			for ( const pathPart of fullPath ) {
				const childNode = currentNode.children.find(
					( node: FileBrowserNode ) => node.path === pathPart
				);
				if ( ! childNode ) {
					return null;
				}
				currentNode = childNode;
			}
			return currentNode;
		},
		[]
	);

	const getParentAndIndex = useCallback(
		(
			currentState: FileBrowserState,
			fullPath: string[] | string
		): { parent?: FileBrowserNode; index?: number } => {
			let currentNode = currentState.rootNode;
			const result: { parent?: FileBrowserNode; index?: number } = {};

			if ( fullPath.length === 0 ) {
				return result;
			}

			if ( typeof fullPath === 'string' ) {
				fullPath = fullPath.split( '/' );
				fullPath = fullPath.filter( pathPart => pathPart.length > 0 );
			}

			if ( fullPath.length > 0 && fullPath[ 0 ] === '/' ) {
				fullPath.shift();
			}

			for ( const pathPart of fullPath ) {
				const childNode = currentNode.children.find(
					( node: FileBrowserNode ) => node.path === pathPart
				);
				if ( ! childNode ) {
					return result;
				}
				result.parent = currentNode;
				result.index = currentNode.children.indexOf( childNode );

				currentNode = childNode;
			}
			return result;
		},
		[]
	);

	const updateChildrenStatus = useCallback(
		( nodeToUpdate: FileBrowserNode, status: 'checked' | 'unchecked' | 'mixed' ) => {
			for ( let i = 0; i < nodeToUpdate.children.length; i++ ) {
				const newChild = { ...nodeToUpdate.children[ i ] };
				newChild.checkState = status;
				nodeToUpdate.children[ i ] = newChild;
				if ( newChild.childrenLoaded && newChild.children.length > 0 ) {
					updateChildrenStatus( newChild, status );
				}
			}
		},
		[]
	);

	const getCheckedStatus = useCallback(
		( nodeToIterate: FileBrowserNode ): FileBrowserCheckState => {
			let isMixed = false;
			let isChecked = false;
			let isUnchecked = false;
			nodeToIterate.children.forEach( ( child: FileBrowserNode ) => {
				if ( child.checkState === 'mixed' ) {
					isMixed = true;
				} else if ( child.checkState === 'checked' ) {
					isChecked = true;
				} else {
					isUnchecked = true;
				}
			} );

			if ( isMixed ) {
				return 'mixed';
			} else if ( isChecked && isUnchecked ) {
				return 'mixed';
			} else if ( isChecked ) {
				return 'checked';
			}
			return 'unchecked';
		},
		[]
	);

	const fileBrowserToRestoreType = useCallback( ( type: string ): FileBrowserNodeType => {
		switch ( type ) {
			case 'table':
			case 'plugin':
			case 'theme':
				return type;
			default:
				return 'file';
		}
	}, [] );

	const updateParent = useCallback(
		( currentState: FileBrowserState, node: FileBrowserNode ): FileBrowserState => {
			if ( node.path === '/' ) {
				return currentState;
			}
			const nodePath = [ ...node.ancestors ];
			const { parent: parentOfParent, index } = getParentAndIndex( currentState, nodePath );
			if ( parentOfParent === undefined || index === undefined ) {
				const newRoot = { ...currentState.rootNode };
				newRoot.checkState = getCheckedStatus( newRoot );
				currentState.rootNode = newRoot;
				return currentState;
			}
			const newNode = { ...parentOfParent.children[ index ] };
			newNode.checkState = getCheckedStatus( newNode );
			parentOfParent.children[ index ] = newNode;
			return updateParent( currentState, newNode );
		},
		[ getParentAndIndex, getCheckedStatus ]
	);

	const setNodeCheckState = useCallback(
		( nodePath: string, checkState: FileBrowserCheckState, rewindId: number ) => {
			const currentState = getStateForRewindId( rewindId );
			const newState = { ...currentState };

			const { parent, index } = getParentAndIndex( newState, nodePath );
			if ( ! parent || index === undefined ) {
				if ( '/' === nodePath ) {
					const newRoot = { ...newState.rootNode };
					newRoot.checkState = checkState;
					updateChildrenStatus( newRoot, checkState );
					newState.rootNode = newRoot;
					stateMapRef.current.set( rewindId, newState );
					triggerUpdate();
					return;
				}
				return;
			}
			const newNode = { ...parent.children[ index ] };
			const nodeToUpdate = getNodeFromState( currentState, nodePath );
			if ( ! nodeToUpdate ) {
				return;
			}
			newNode.checkState = checkState;
			parent.children[ index ] = newNode;
			if ( checkState !== 'mixed' ) {
				updateChildrenStatus( newNode, checkState );
			}
			updateParent( newState, newNode );
			stateMapRef.current.set( rewindId, newState );
			triggerUpdate();
		},
		[
			getStateForRewindId,
			getParentAndIndex,
			getNodeFromState,
			updateChildrenStatus,
			updateParent,
			triggerUpdate,
		]
	);

	const addChildNodes = useCallback(
		( parentPath: string, childrenPaths: FileBrowserItem[], rewindId: number ) => {
			const currentState = getStateForRewindId( rewindId );
			const parentNode = getNodeFromState( currentState, parentPath );
			if ( ! parentNode ) {
				return;
			}
			if ( parentNode.childrenLoaded ) {
				return;
			}
			for ( const childPath of childrenPaths ) {
				parentNode.children.push( {
					id: childPath.id ?? '',
					path: childPath.path ?? childPath.name,
					type: fileBrowserToRestoreType( childPath.type ),
					ancestors: [ ...parentNode.ancestors, parentNode.path ],
					checkState: parentNode.checkState === 'checked' ? 'checked' : 'unchecked',
					childrenLoaded: false,
					children: [],
					totalItems: childPath.totalItems ?? 0,
				} );
			}

			parentNode.childrenLoaded = true;
			stateMapRef.current.set( rewindId ?? -1, currentState );
			triggerUpdate();
		},
		[ getStateForRewindId, getNodeFromState, fileBrowserToRestoreType, triggerUpdate ]
	);

	const getNodeFullPath = useCallback( ( node: FileBrowserNode ): string => {
		let fullPath = node.ancestors.join( '/' ) + '/' + node.path;
		if ( node.ancestors[ 0 ] === '/' ) {
			fullPath = fullPath.slice( 1 );
		}
		return fullPath;
	}, [] );

	const addChildrenToList = useCallback(
		(
			currentNode: FileBrowserNode,
			currentList: FileBrowserNodeCheckList
		): FileBrowserNodeCheckList => {
			if ( currentNode.checkState === 'unchecked' ) {
				return currentList;
			}

			if ( currentNode.checkState === 'checked' ) {
				currentList.includeList.push( {
					id: currentNode.id,
					path: getNodeFullPath( currentNode ),
					type: currentNode.type,
				} );

				if ( currentNode.path === '/' ) {
					currentNode.children.forEach( ( node: FileBrowserNode ) => {
						if ( node.checkState === 'checked' ) {
							currentList.totalItems += node.totalItems;
						}
					} );
				}

				return currentList;
			}

			const totalChildren = currentNode.children.length;
			const selectedChildren = currentNode.children.reduce(
				( accumulator, node ) => ( node.checkState !== 'checked' ? accumulator : accumulator + 1 ),
				0
			);

			if ( totalChildren === selectedChildren ) {
				currentList.includeList.push( {
					id: currentNode.id,
					path: getNodeFullPath( currentNode ),
					type: currentNode.type,
				} );
				return currentList;
			}

			// More-than-half selected without any grandchildren → describe as
			// "include parent, exclude these" instead of listing every child
			// individually. Keeps the restore/download payload short.
			const useExclusion =
				selectedChildren > totalChildren / 2 &&
				! currentNode.children.some( ( node: FileBrowserNode ) => {
					return node.children.length > 0;
				} );

			if ( useExclusion ) {
				currentList.includeList.push( {
					id: currentNode.id,
					path: getNodeFullPath( currentNode ),
					type: currentNode.type,
				} );

				currentNode.children.forEach( ( node: FileBrowserNode ) => {
					if ( node.checkState === 'checked' ) {
						currentList.totalItems += node.totalItems;
					}

					if ( node.checkState === 'unchecked' ) {
						currentList.excludeList.push( {
							id: node.id,
							path: getNodeFullPath( node ),
							type: node.type,
						} );
					}
				} );
				return currentList;
			}

			currentNode.children.forEach( ( node: FileBrowserNode ) => {
				if ( 'checked' === node.checkState ) {
					currentList.includeList.push( {
						id: node.id,
						path: getNodeFullPath( node ),
						type: node.type,
					} );
					currentList.totalItems += node.totalItems;
				}
				if ( 'mixed' === node.checkState ) {
					currentList = addChildrenToList( node, currentList );
				}
			} );
			return currentList;
		},
		[ getNodeFullPath ]
	);

	const addSelectedItemsToList = useCallback(
		(
			currentNode: FileBrowserNode,
			selectedList: FileBrowserCheckListInfo[]
		): FileBrowserCheckListInfo[] => {
			if ( currentNode.checkState === 'unchecked' ) {
				return selectedList;
			}

			if ( currentNode.checkState === 'checked' ) {
				selectedList.push( {
					id: currentNode.id,
					path: getNodeFullPath( currentNode ),
					type: currentNode.type,
				} );
				return selectedList;
			}

			currentNode.children.forEach( ( node: FileBrowserNode ) => {
				selectedList = addSelectedItemsToList( node, selectedList );
			} );

			return selectedList;
		},
		[ getNodeFullPath ]
	);

	const getSelectedList = useCallback(
		( rewindId: number ): FileBrowserCheckListInfo[] => {
			let selectedList: FileBrowserCheckListInfo[] = [];

			const currentState = getStateForRewindId( rewindId );
			const currentNode = currentState.rootNode;
			if ( currentNode === undefined ) {
				return selectedList;
			}

			selectedList = addSelectedItemsToList( currentNode, selectedList );

			return selectedList;
		},
		[ getStateForRewindId, addSelectedItemsToList ]
	);

	const getCheckList = useCallback(
		( rewindId: number ): FileBrowserNodeCheckList => {
			let checkList: FileBrowserNodeCheckList = {
				totalItems: 0,
				includeList: [],
				excludeList: [],
			};

			const currentState = getStateForRewindId( rewindId );
			const currentNode = currentState.rootNode;
			if ( currentNode === undefined ) {
				return checkList;
			}

			checkList = addChildrenToList( currentNode, checkList );

			return checkList;
		},
		[ getStateForRewindId, addChildrenToList ]
	);

	const getNode = useCallback(
		( path: string, rewindId: number ): FileBrowserNode | null => {
			const currentState = getStateForRewindId( rewindId );
			return getNodeFromState( currentState, path );
		},
		[ getStateForRewindId, getNodeFromState ]
	);

	return {
		getNode,
		getCheckList,
		getSelectedList,
		setNodeCheckState,
		addChildNodes,
	};
}
