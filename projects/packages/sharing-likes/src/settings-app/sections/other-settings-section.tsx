import { __ } from '@wordpress/i18n';
import { SectionCard } from '../components/section-card';
import { TextSetting } from '../components/text-setting';
import { useSettings } from '../data/queries';
import type { JSX } from 'react';

/**
 * Settings that belong to no section above: today, the Twitter Site Tag.
 *
 * @return Section, or null when there is nothing to put in it.
 */
export function OtherSettingsSection(): JSX.Element | null {
	const settings = useSettings();
	if ( ! settings || ! ( 'twitter_site_tag' in settings ) ) {
		return null;
	}

	return (
		<SectionCard title={ __( 'Other settings', 'jetpack-sharing-likes' ) }>
			<TextSetting
				settingKey="twitter_site_tag"
				label={ __( 'Twitter Site Tag', 'jetpack-sharing-likes' ) }
				help={ __(
					'The Twitter username of the owner of this site’s domain.',
					'jetpack-sharing-likes'
				) }
			/>
		</SectionCard>
	);
}
