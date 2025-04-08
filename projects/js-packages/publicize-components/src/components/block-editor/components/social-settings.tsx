import { ThemeProvider } from '@automattic/jetpack-components';
import { PanelBody } from '@wordpress/components';
import { PostTypeSupportCheck } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import { usePostCanUseSig } from '../../../hooks/use-post-can-use-sig';
import { getSocialScriptData } from '../../../utils';
import PublicizePanel from '../../panel';
import SocialImageGeneratorPanel from '../../social-image-generator/panel';
import SocialPreviewsModal from '../../social-previews/modal';
import SocialPreviewsPanel from '../../social-previews/panel';
import { Placeholder } from './placeholder';
import { UpsellNotice } from './upsell';

const RenderSettings = () => {
	const postCanUseSig = usePostCanUseSig();

	const [ isModalOpened, setIsModalOpened ] = useState( false );

	const openModal = useCallback( () => setIsModalOpened( true ), [] );
	const closeModal = useCallback( () => setIsModalOpened( false ), [] );

	return (
		<ThemeProvider targetDom={ document.body }>
			{ /* Share post panel */ }
			<PublicizePanel>
				<UpsellNotice />
			</PublicizePanel>

			{ /* Social Image Generator panel */ }
			{ postCanUseSig && <SocialImageGeneratorPanel /> }

			{ /* Social Previews panel */ }
			{ isModalOpened && <SocialPreviewsModal onClose={ closeModal } /> }
			<PanelBody title={ __( 'Social Previews', 'jetpack-publicize-components' ) }>
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
