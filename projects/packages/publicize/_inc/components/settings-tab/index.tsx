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
import SocialModuleCard from './social-module-card';
import { useTurnOnSocial } from './turn-on-social-context';
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
 * A compact master on/off (`SocialModuleCard`) sits at the top whenever the
 * current user can toggle the module (`canToggleSocialModule()`), and when the
 * module is off the tab collapses to `PublicizeInactiveEmptyState`, which turns
 * it on in place. This replaces the old link-out to the wp-admin module-toggles
 * surface (umbrella #48824), which is unreachable on WordPress.com Atomic sites
 * using the Calypso interface. WPCOM Simple sites never see the toggle —
 * Publicize is always on there and `canToggleSocialModule()` returns false.
 *
 * @return The Settings tab body.
 */
export default function SettingsTab(): JSX.Element {
	const isPublicizeActive = useSelect(
		select => select( socialStore ).getSocialModuleSettings().publicize,
		[]
	);

	// While turning Social on we keep showing the turn-on surface until the
	// reload — the store flips `publicize` on optimistically, but rendering the
	// settings cards for that sub-second gap before the reload just flickers.
	const { isEnabling } = useTurnOnSocial();

	if ( ( ! isPublicizeActive || isEnabling ) && canToggleSocialModule() ) {
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
			{ canToggleSocialModule() && <SocialModuleCard /> }
			{ hasMessageTemplates && <DefaultShareMessageCard /> }
			{ hasSocialPlugin && <ContentCreationCard /> }
			{ hasImageGenerator && <CustomizeMediaCard /> }
			<CustomizeLinksCard />
		</Stack>
	);
}
