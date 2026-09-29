/**
 * External dependencies
 */
import { Icon, Stack } from '@jetpack-premium-analytics/externals';
import { useCallback, useState, type ComponentProps, type ReactNode } from 'react';
/**
 * Internal dependencies
 */
import styles from './report-thumbnail-title.module.scss';

/** Class names for the title link, so a long title truncates beside the thumbnail. */
export const REPORT_THUMBNAIL_TITLE_LINK_CLASS_NAMES = {
	internal: styles.titleLink,
	external: styles.titleLink,
	plain: styles.titleLink,
	text: styles.titleText,
};

export type ReportThumbnailTitleProps = {
	thumbnailUrl?: string;
	/** Shown when there is no thumbnail, or it fails to load. */
	fallbackIcon: ComponentProps< typeof Icon >[ 'icon' ];
	children: ReactNode;
};

/**
 * A report row title led by the entity's thumbnail.
 *
 * @param props              - Component props.
 * @param props.thumbnailUrl - Thumbnail URL.
 * @param props.fallbackIcon - Icon shown without a loadable thumbnail.
 * @param props.children     - The title.
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
						className={ styles.thumbnail }
						onError={ handleError }
					/>
				) : (
					<span data-testid="report-thumbnail-placeholder">
						<Icon icon={ fallbackIcon } size={ 16 } />
					</span>
				) }
			</span>
			{ children }
		</Stack>
	);
}
