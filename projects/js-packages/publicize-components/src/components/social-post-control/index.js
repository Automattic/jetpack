import { ThemeProvider } from '@automattic/jetpack-components';
import { CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import useAttachedMedia from '../../hooks/use-attached-media';
import styles from './styles.module.scss';

/**
 * The component that handles the social post checkbox.
 *
 * @returns {object} The SocialPostControl Component.
 */
export default function SocialPostControl() {
	const { shouldUploadAttachedMedia, updateShouldUploadAttachedMedia } = useAttachedMedia();

	const onCheckboxChange = useCallback(
		value => {
			updateShouldUploadAttachedMedia( value );
		},
		[ updateShouldUploadAttachedMedia ]
	);

	return (
		<ThemeProvider>
			<CheckboxControl
				className={ styles.checkbox }
				checked={ shouldUploadAttachedMedia }
				onChange={ onCheckboxChange }
				label={ __( 'Share as a social post', 'jetpack' ) }
				help={ __(
					'By default, the image and text appear on social media as a link preview. To optimize engagement, share as a social post.',
					'jetpack'
				) }
			/>
		</ThemeProvider>
	);
}
