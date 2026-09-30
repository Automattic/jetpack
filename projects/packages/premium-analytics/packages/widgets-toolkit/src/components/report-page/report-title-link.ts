/**
 * Internal dependencies
 */
import styles from './report-title-link.module.scss';
import type { PostTitleLinkProps } from '../post-title-link/post-title-link';
import type { VideoTitleLinkProps } from '../video-title-link/video-title-link';

/**
 * Class names for a title link in a records table's `titleField`, so a long title
 * ellipsizes while keeping its outbound marker.
 */
export const REPORT_TITLE_LINK_CLASS_NAMES = {
	internal: styles.link,
	external: styles.link,
	plain: styles.link,
	text: styles.text,
} satisfies NonNullable< PostTitleLinkProps[ 'classNames' ] > &
	NonNullable< VideoTitleLinkProps[ 'classNames' ] >;
