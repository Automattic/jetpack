import { ThemeProvider } from '@automattic/jetpack-components';
import { PanelBody } from '@wordpress/components';
import { PostTypeSupportCheck } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import { getSocialScriptData } from '../../../utils';
import PublicizePanel from '../../panel';
import SocialPreviewsModal from '../../social-previews/modal';
import SocialPreviewsPanel from '../../social-previews/panel';
import { Placeholder } from './placeholder';

const RenderSettings = () => {
	const [ isModalOpened, setIsModalOpened ] = useState( false );

	const openModal = useCallback( () => setIsModalOpened( true ), [] );
	const closeModal = useCallback( () => setIsModalOpened( false ), [] );

	return (
		<ThemeProvider targetDom={ document.body }>
			<PublicizePanel />

			{ /* Social Previews panel */ }
			{ isModalOpened && <SocialPreviewsModal onClose={ closeModal } /> }
			<PanelBody title={ __( 'Link preview', 'jetpack-publicize-components' ) }>
				<SocialPreviewsPanel openModal={ openModal } />
			</PanelBody>
		</ThemeProvider>
	);
};

/**
 * Social settings in the block editor
 *
 * @return The social settings component
 */
export function SocialSettings() {
	return (
		<PostTypeSupportCheck supportKeys="publicize">
			{ getSocialScriptData().is_publicize_enabled ? <RenderSettings /> : <Placeholder /> }
		</PostTypeSupportCheck>
	);
}
