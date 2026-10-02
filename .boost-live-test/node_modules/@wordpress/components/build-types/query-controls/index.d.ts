import type { QueryControlsProps } from './types';
/**
 * Controls to query for posts.
 *
 * ```jsx
 * const MyQueryControls = () => (
 *   <QueryControls
 *     { ...{ maxItems, minItems, numberOfItems, order, orderBy, orderByOptions } }
 *     onOrderByChange={ ( newOrderBy ) => {
 *       updateQuery( { orderBy: newOrderBy } )
 *     }
 *     onOrderChange={ ( newOrder ) => {
 *       updateQuery( { order: newOrder } )
 *     }
 *     categoriesList={ categories }
 *     selectedCategoryId={ category }
 *     onCategoryChange={ ( newCategory ) => {
 *       updateQuery( { category: newCategory } )
 *     }
 *     onNumberOfItemsChange={ ( newNumberOfItems ) => {
 *       updateQuery( { numberOfItems: newNumberOfItems } )
 *     } }
 *   />
 * );
 * ```
 */
export declare function QueryControls({ authorList, selectedAuthorId, numberOfItems, order, orderBy, orderByOptions, maxItems, minItems, onAuthorChange, onNumberOfItemsChange, onOrderChange, onOrderByChange, ...props }: QueryControlsProps): import("react").JSX.Element;
export default QueryControls;
//# sourceMappingURL=index.d.ts.map