/**
 * Content component for Edit Template Modal
 *
 * Right side of the modal containing the live preview
 */

import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import useSigPreview from '../../../hooks/use-sig-preview';
import { type ImageType } from '../../../hooks/use-sig-preview/utils';
import styles from './styles.module.scss';

interface ContentProps {
	imageType: ImageType;
	imageId: number | null;
	customText: string;
	template: string | null;
	font: string;
}

/**
 * Content component with live preview
 *
 * @param props            - Component props
 * @param props.imageType  - Image type
 * @param props.imageId    - Image ID
 * @param props.customText - Custom text
 * @param props.template   - Template name
 * @param props.font       - Font name
 * @return Content component
 */
export function Content( { imageType, imageId, customText, template, font }: ContentProps ) {
	const { url, isLoading } = useSigPreview( true, {
		shouldDebounce: true,
		imageType,
		imageId,
		customText,
		template: template || undefined,
		font,
	} );

	return (
		<div className={ styles.content }>
			<div className={ styles.preview }>
				{ isLoading ? (
					<Spinner />
				) : (
					url && (
						<img
							className={ styles.previewImage }
							src={ url }
							alt={ __( 'Generated preview', 'jetpack-publicize-components' ) }
						/>
					)
				) }
			</div>
		</div>
	);
}
