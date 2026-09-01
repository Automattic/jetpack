import { Icon, VisuallyHidden } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import clsx from 'clsx';
import { useConnectionPreviewData } from '../../../hooks/use-connection-preview-data';
import { PostPreview } from './post-preview';
import styles from './styles.module.scss';
import type { Connection } from '../../../social-store/types';

type PreviewSectionProps = {
	connection: Connection;
};

/**
 * Preview loading placeholder.
 *
 * @return Preview loading placeholder.
 */
function PreviewSkeleton() {
	return (
		<div className={ styles[ 'preview-skeleton' ] } role="status">
			<VisuallyHidden>{ __( 'Loading post preview.', 'jetpack-publicize-pkg' ) }</VisuallyHidden>
			<div className={ styles[ 'preview-skeleton-header' ] }>
				<div className={ styles[ 'preview-skeleton-avatar' ] } />
				<div className={ styles[ 'preview-skeleton-lines' ] }>
					<div className={ styles[ 'preview-skeleton-line' ] } />
					<div
						className={ clsx(
							styles[ 'preview-skeleton-line' ],
							styles[ 'preview-skeleton-line-short' ]
						) }
					/>
				</div>
			</div>
			<div className={ styles[ 'preview-skeleton-copy' ] }>
				<div className={ styles[ 'preview-skeleton-line' ] } />
				<div
					className={ clsx(
						styles[ 'preview-skeleton-line' ],
						styles[ 'preview-skeleton-line-medium' ]
					) }
				/>
			</div>
			<div className={ styles[ 'preview-skeleton-media' ] } />
			<div
				className={ clsx(
					styles[ 'preview-skeleton-line' ],
					styles[ 'preview-skeleton-line-short' ]
				) }
			/>
		</div>
	);
}

/**
 * Enabled preview area.
 *
 * @param {PreviewSectionProps} props - The component props.
 * @return Enabled preview area.
 */
function EnabledPreview( { connection }: PreviewSectionProps ) {
	const previewData = useConnectionPreviewData( connection );

	return (
		<>
			<VisuallyHidden as="h2">
				{ _x( 'Preview', 'Noun: Post preview section heading', 'jetpack-publicize-pkg' ) }
			</VisuallyHidden>
			<div className={ styles[ 'preview-wrapper' ] } aria-busy={ previewData.isLoading }>
				{ previewData.isLoading ? (
					<PreviewSkeleton />
				) : (
					<PostPreview connection={ connection } previewData={ previewData } />
				) }
			</div>
		</>
	);
}

/**
 * Preview section component.
 *
 * @param {PreviewSectionProps} props - The component props.
 * @return - Preview section component.
 */
export function PreviewSection( { connection }: PreviewSectionProps ) {
	return (
		<section
			aria-label={ __( 'Post Preview', 'jetpack-publicize-pkg' ) }
			className={ styles[ 'preview-section' ] }
		>
			{ connection.enabled ? (
				<EnabledPreview connection={ connection } />
			) : (
				<div className={ styles[ 'inactive-preview' ] }>
					<Icon icon={ info } size={ 48 } />
					<div>{ __( "The post won't be shared to this account.", 'jetpack-publicize-pkg' ) }</div>
				</div>
			) }
		</section>
	);
}
