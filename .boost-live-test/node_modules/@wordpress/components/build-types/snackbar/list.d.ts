import type { SnackbarListProps } from './types';
import type { WordPressComponentProps } from '../context';
/**
 * Renders a list of notices.
 *
 * ```jsx
 * const MySnackbarListNotice = () => (
 *   <SnackbarList
 *     notices={ notices }
 *     onRemove={ removeNotice }
 *   />
 * );
 * ```
 */
export declare function SnackbarList({ notices, className, children, onRemove, }: WordPressComponentProps<SnackbarListProps, 'div'>): import("react").JSX.Element;
export default SnackbarList;
//# sourceMappingURL=list.d.ts.map