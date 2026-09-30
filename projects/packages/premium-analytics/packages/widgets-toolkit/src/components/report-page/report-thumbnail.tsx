/**
 * External dependencies
 */
import { Icon } from '@jetpack-premium-analytics/externals';
import { useCallback, useState, type ComponentProps } from 'react';
/**
 * Internal dependencies
 */
import styles from './report-thumbnail.module.scss';

type ReportThumbnailProps = {
	thumbnailUrl?: string;
	/** Shown when there is no thumbnail, or it fails to load. */
	fallbackIcon: ComponentProps< typeof Icon >[ 'icon' ];
};

/**
 * A records-table row thumbnail, rendered by the view's `mediaField`.
 *
 * @param props              - Component props.
 * @param props.thumbnailUrl - Thumbnail URL.
 * @param props.fallbackIcon - Icon shown without a loadable thumbnail.
 * @return The thumbnail, or its fallback icon.
 */
export function ReportThumbnail( {
	thumbnailUrl,
	fallbackIcon,
}: ReportThumbnailProps ): JSX.Element {
	const [ failedUrl, setFailedUrl ] = useState< string >();
	const handleError = useCallback( () => setFailedUrl( thumbnailUrl ), [ thumbnailUrl ] );

	if ( thumbnailUrl && failedUrl !== thumbnailUrl ) {
		return <img src={ thumbnailUrl } alt="" loading="lazy" onError={ handleError } />;
	}

	return (
		<span className={ styles.placeholder } data-testid="report-thumbnail-placeholder">
			<Icon icon={ fallbackIcon } size={ 16 } />
		</span>
	);
}
