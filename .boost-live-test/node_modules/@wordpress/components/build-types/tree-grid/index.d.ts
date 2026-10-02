import type { TreeGridProps } from './types';
/**
 * `TreeGrid` is used to create a tree hierarchy.
 * It is not a visually styled component, but instead helps with adding
 * keyboard navigation and roving tab index behaviors to tree grid structures.
 *
 * A tree grid is a hierarchical 2 dimensional UI component, for example it could be
 * used to implement a file system browser.
 *
 * A tree grid allows the user to navigate using arrow keys.
 * Up/down to navigate vertically across rows, and left/right to navigate horizontally
 * between focusables in a row.
 *
 * The `TreeGrid` renders both a `table` and `tbody` element, and is intended to be used
 * with `TreeGridRow` (`tr`) and `TreeGridCell` (`td`) to build out a grid.
 *
 * ```jsx
 * function TreeMenu() {
 * 	return (
 * 		<TreeGrid>
 * 			<TreeGridRow level={ 1 } positionInSet={ 1 } setSize={ 2 }>
 * 				<TreeGridCell>
 * 					{ ( props ) => (
 * 						<Button onClick={ onSelect } { ...props }>Select</Button>
 * 					) }
 * 				</TreeGridCell>
 * 				<TreeGridCell>
 * 					{ ( props ) => (
 * 						<Button onClick={ onMove } { ...props }>Move</Button>
 * 					) }
 * 				</TreeGridCell>
 * 			</TreeGridRow>
 * 			<TreeGridRow level={ 1 } positionInSet={ 2 } setSize={ 2 }>
 * 				<TreeGridCell>
 * 					{ ( props ) => (
 * 						<Button onClick={ onSelect } { ...props }>Select</Button>
 * 					) }
 * 				</TreeGridCell>
 * 				<TreeGridCell>
 * 					{ ( props ) => (
 * 						<Button onClick={ onMove } { ...props }>Move</Button>
 * 					) }
 * 				</TreeGridCell>
 * 			</TreeGridRow>
 * 			<TreeGridRow level={ 2 } positionInSet={ 1 } setSize={ 1 }>
 * 				<TreeGridCell>
 * 					{ ( props ) => (
 * 						<Button onClick={ onSelect } { ...props }>Select</Button>
 * 					) }
 * 				</TreeGridCell>
 * 				<TreeGridCell>
 * 					{ ( props ) => (
 * 						<Button onClick={ onMove } { ...props }>Move</Button>
 * 					) }
 * 				</TreeGridCell>
 * 			</TreeGridRow>
 * 		</TreeGrid>
 * 	);
 * }
 * ```
 *
 * @see {@link https://www.w3.org/TR/wai-aria-practices/examples/treegrid/treegrid-1.html}
 */
export declare const TreeGrid: import("react").ForwardRefExoticComponent<TreeGridProps & Omit<Omit<import("react").DetailedHTMLProps<import("react").TableHTMLAttributes<HTMLTableElement>, HTMLTableElement>, "ref">, "as" | keyof TreeGridProps> & import("react").RefAttributes<HTMLTableElement>>;
export default TreeGrid;
export { default as TreeGridRow } from './row';
export { default as TreeGridCell } from './cell';
export { default as TreeGridItem } from './item';
//# sourceMappingURL=index.d.ts.map