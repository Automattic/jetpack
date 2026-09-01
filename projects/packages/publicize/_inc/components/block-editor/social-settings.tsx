import { ThemeProvider } from '@automattic/jetpack-components';
import { PostTypeSupportCheck } from '@wordpress/editor';
import { getSocialScriptData } from '../../utils';
import { LinkPreviewPanel } from '../link-preview-panel';
import PublicizePanel from '../panel';
import { Placeholder } from './placeholder';

const RenderSettings = () => {
	return (
		<ThemeProvider targetDom={ document.body }>
			<PublicizePanel />
			<LinkPreviewPanel />
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
