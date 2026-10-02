import type { WordPressComponentProps } from '../context';
import type { NoticeListProps } from './types';
/**
 * `NoticeList` is a component used to render a collection of notices.
 *
 *```jsx
 * import { Notice, NoticeList } from `@wordpress/components`;
 *
 * const MyNoticeList = () => {
 *	const [ notices, setNotices ] = useState( [
 *		{
 *			id: 'second-notice',
 *			content: 'second notice content',
 *		},
 *		{
 *			id: 'fist-notice',
 *			content: 'first notice content',
 *		},
 *	] );
 *
 *	const removeNotice = ( id ) => {
 *		setNotices( notices.filter( ( notice ) => notice.id !== id ) );
 *	};
 *
 *	return <NoticeList notices={ notices } onRemove={ removeNotice } />;
 *};
 *```
 */
declare function NoticeList({ notices, onRemove, className, children, }: WordPressComponentProps<NoticeListProps, 'div', false>): import("react").JSX.Element;
export default NoticeList;
//# sourceMappingURL=list.d.ts.map