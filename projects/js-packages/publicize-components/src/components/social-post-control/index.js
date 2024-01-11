import { ThemeProvider } from '@automattic/jetpack-components';
import { CheckboxControl, Disabled } from '@wordpress/components';
import { useCallback, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useAttachedMedia from '../../hooks/use-attached-media';
import styles from './styles.module.scss';

const DISABLED_HELP_TEXT = __(
	'You need a featured image or media attached to your post to be able to share as a social post.',
	'jetpack'
);

const SHARE_AS_SOCIAL_POST_TEXT = __(
	'By default, the image and text appear on social media as a link preview. To optimize engagement, share as a social post.',
	'jetpack'
);

/**
 * The component that handles the social post checkbox.
 *
 * @param {boolean} disabled -  Indicates whether the checkbox is disabled or not.
 * @returns {object} The SocialPostControl Component.
 */
export default function SocialPostControl( { disabled = false } ) {
	const { shouldUploadAttachedMedia, updateShouldUploadAttachedMedia } = useAttachedMedia();

	const onCheckboxChange = useCallback(
		value => {
			updateShouldUploadAttachedMedia( value );
		},
		[ updateShouldUploadAttachedMedia ]
	);

	const ControlWrapper = disabled ? Disabled : Fragment;
	const controlWrapperProps = disabled ? { className: styles.disabled } : {};

	return (
		<ThemeProvider>
			<ControlWrapper { ...controlWrapperProps }>
				<CheckboxControl
					className={ styles.checkbox }
					checked={ shouldUploadAttachedMedia }
					onChange={ onCheckboxChange }
					label={ __( 'Share as a social post', 'jetpack' ) }
					help={ disabled ? DISABLED_HELP_TEXT : SHARE_AS_SOCIAL_POST_TEXT }
				/>
			</ControlWrapper>
		</ThemeProvider>
	);
}
