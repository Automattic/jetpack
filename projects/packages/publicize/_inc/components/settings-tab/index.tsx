import { currentUserCan, siteHasFeature } from '@automattic/jetpack-script-data';
import { useSelect } from '@wordpress/data';
import { Card, Stack } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';
import { features, getSocialScriptData } from '../../utils';
import { canToggleSocialModule } from '../../utils/misc';
import ContentCreationCard from './content-creation-card';
import CustomizeLinksCard from './customize-links-card';
import CustomizeMediaCard from './customize-media-card';
import DefaultShareMessageCard from './default-share-message-card';
import PublicizeInactiveEmptyState from './publicize-inactive-empty-state';
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
 * The legacy master Publicize on/off toggle (`SocialModuleToggle`) is
 * intentionally not ported; product visibility lives on the wp-admin
 * module-toggles surface. When an admin lands on the page while
 * Publicize is inactive on a self-hosted site, the empty state points
 * them back there. WPCOM Simple sites never hit that state — Publicize
 * is always on, and `canToggleSocialModule()` returns false.
 *
 * @return The Settings tab body.
 */
export default function SettingsTab(): JSX.Element {
	const isPublicizeActive = useSelect(
		select => select( socialStore ).getSocialModuleSettings().publicize,
		[]
	);

	if ( ! isPublicizeActive && canToggleSocialModule() ) {
		return (
			<div className="jetpack-social-settings">
				<Card.Root>
					<Card.Content>
						<PublicizeInactiveEmptyState />
					</Card.Content>
				</Card.Root>
			</div>
		);
	}

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
