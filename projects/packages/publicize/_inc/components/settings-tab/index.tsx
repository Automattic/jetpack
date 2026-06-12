import { currentUserCan, siteHasFeature } from '@automattic/jetpack-script-data';
import { Stack } from '@wordpress/ui';
import { features, getSocialScriptData } from '../../utils';
import ContentCreationCard from './content-creation-card';
import CustomizeLinksCard from './customize-links-card';
import CustomizeMediaCard from './customize-media-card';
import DefaultShareMessageCard from './default-share-message-card';
import './style.scss';

/**
 * Settings tab — sits inside the modernized Social chassis (`SocialPage`
 * → `Tabs.Panel value="settings"`). Composes four WPDS `Card` groups
 * that mirror the design's section grouping:
 *
 * - **Default share message** — global message-template editor, sticker-gated.
 * - **Content creation** — Social Notes (Social-plugin only — the CPT registration lives in the plugin).
 * - **Customize media** — Social Image Generator (paid).
 * - **Customize links** — UTM parameters.
 *
 * The legacy master Publicize on/off toggle (`SocialModuleToggle`) is not
 * ported here. When Publicize is off and the user can switch it on, the
 * page-level `ActivationGate` (see `useSocialGate`) intercepts before this
 * tab renders, so the Settings tab never has to handle the inactive state.
 *
 * @return The Settings tab body.
 */
export default function SettingsTab(): JSX.Element {
	const hasSocialPlugin = Boolean( getSocialScriptData().plugin_info.social.version );
	const hasImageGenerator = siteHasFeature( features.IMAGE_GENERATOR );
	const hasMessageTemplates =
		siteHasFeature( features.MESSAGE_TEMPLATES ) && currentUserCan( 'manage_options' );

	return (
		<Stack direction="column" gap="lg" className="jetpack-social-settings">
			{ hasMessageTemplates && <DefaultShareMessageCard /> }
			{ hasSocialPlugin && <ContentCreationCard /> }
			{ hasImageGenerator && <CustomizeMediaCard /> }
			<CustomizeLinksCard />
		</Stack>
	);
}
