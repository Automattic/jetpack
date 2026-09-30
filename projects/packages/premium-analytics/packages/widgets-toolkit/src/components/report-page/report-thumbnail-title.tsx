/**
 * External dependencies
 */
import { Icon, Stack } from '@jetpack-premium-analytics/externals';
import { useCallback, useState, type ComponentProps, type ReactNode } from 'react';
/**
 * Internal dependencies
 */
import styles from './report-thumbnail-title.module.scss';
import type { PostTitleLinkProps } from '../post-title-link/post-title-link';
import type { VideoTitleLinkProps } from '../video-title-link/video-title-link';

const TITLE_LINK_CLASS_NAMES = {
	internal: styles.titleLink,
	external: styles.titleLink,
	plain: styles.titleLink,
	text: styles.titleText,
} satisfies NonNullable< PostTitleLinkProps[ 'classNames' ] > &
	NonNullable< VideoTitleLinkProps[ 'classNames' ] >;

type ReportThumbnailTitleProps = {
	thumbnailUrl?: string;
	/** Shown when there is no thumbnail, or it fails to load. */
	fallbackIcon: ComponentProps< typeof Icon >[ 'icon' ];
	/** Renders the title link; pass it the class names so a long title truncates. */
	children: ( linkClassNames: typeof TITLE_LINK_CLASS_NAMES ) => ReactNode;
};

/**
 * A report row title led by the entity's thumbnail.
 *
 * @param props              - Component props.
 * @param props.thumbnailUrl - Thumbnail URL.
 * @param props.fallbackIcon - Icon shown without a loadable thumbnail.
 * @param props.children     - Renders the title.
 * @return The thumbnail and title.
 */
export function ReportThumbnailTitle( {
	thumbnailUrl,
	fallbackIcon,
	children,
}: ReportThumbnailTitleProps ): JSX.Element {
	const [ failedUrl, setFailedUrl ] = useState< string >();
	const handleError = useCallback( () => setFailedUrl( thumbnailUrl ), [ thumbnailUrl ] );

	return (
		<Stack render={ <span /> } direction="row" gap="sm" align="center" className={ styles.title }>
			<span className={ styles.thumbnailSlot }>
				{ thumbnailUrl && failedUrl !== thumbnailUrl ? (
					<img
						src={ thumbnailUrl }
						alt=""
						width={ 32 }
						height={ 32 }
						loading="lazy"
						className={ styles.thumbnail }
						onError={ handleError }
					/>
				) : (
					<span data-testid="report-thumbnail-placeholder">
						<Icon icon={ fallbackIcon } size={ 16 } />
					</span>
				) }
			</span>
			{ children( TITLE_LINK_CLASS_NAMES ) }
		</Stack>
	);
}
