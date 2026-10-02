import type { NoticeProps } from './types';
/**
 * `Notice` is a component used to communicate feedback to the user.
 *
 *```jsx
 * import { Notice } from `@wordpress/components`;
 *
 * const MyNotice = () => (
 *   <Notice status="error">An unknown error occurred.</Notice>
 * );
 * ```
 */
declare function Notice({ className, status, children, spokenMessage, onRemove, isDismissible, actions, politeness, __unstableHTML, onDismiss, }: NoticeProps): import("react").JSX.Element;
export default Notice;
//# sourceMappingURL=index.d.ts.map