/**
 * Content component for Edit Template Modal
 *
 * Right side of the modal containing the live preview
 */

import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import useSigPreview from '../../../hooks/use-sig-preview';
import styles from './styles.module.scss';
import { LocalState } from './types';

type ContentProps = {
	localState: LocalState;
};

/**
 * Content component with live preview
 *
 * @param props            - Component props
 * @param props.localState - Local state
 * @return Content component
 */
export function Content( { localState }: ContentProps ) {
	const { url, isLoading } = useSigPreview( true, {
		shouldDebounce: true,
		imageType: localState.imageType,
		imageId: localState.imageId,
		customText: localState.customText,
		template: localState.template || undefined,
		font: localState.font,
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
							alt={ __( 'Generated preview', 'jetpack-publicize-pkg' ) }
						/>
					)
				) }
			</div>
		</div>
	);
}
