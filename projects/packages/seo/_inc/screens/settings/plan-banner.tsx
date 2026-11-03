import { __, sprintf } from '@wordpress/i18n';
import UpsellBanner from '../../components/upsell-banner';
import type { SettingsResponse } from '../../data/settings-types';
import type { FC } from 'react';

const planHelp = __(
	'Editing is disabled on your current plan. Upgrade to WordPress.com Premium or higher to edit the locked settings. Your saved settings are kept.',
	'jetpack-seo'
);
const activeOutputHelp = __(
	'Your saved title formats, structured data and home page description still apply.',
	'jetpack-seo'
);
const pausedOutputHelp = __(
	"Jetpack's title formats, structured data and home page description are paused on this plan.",
	'jetpack-seo'
);
const pausedTitlesAndSchemaHelp = __(
	"Jetpack's title formats and structured data are paused on this plan.",
	'jetpack-seo'
);
const legacyDescriptionHelp = __(
	'Your existing home page description still applies and can be edited.',
	'jetpack-seo'
);
const canonicalHelp = __( 'Your saved canonical URL preference still applies.', 'jetpack-seo' );
const canonicalDisabledHelp = __(
	'Jetpack is not adding archive canonical URLs on this site.',
	'jetpack-seo'
);
const aiHelp = __( 'AI crawler rules and llms.txt are paused on this plan.', 'jetpack-seo' );
const disabledOutputHelp = __(
	"Editing also stays disabled while Jetpack's SEO output is turned off.",
	'jetpack-seo'
);

const SettingsPlanBanner: FC< {
	settings: SettingsResponse;
	outputLocked: boolean;
} > = ( { settings, outputLocked } ) => {
	const explanation: string[] = [ planHelp ];
	if ( outputLocked ) {
		explanation.push(
			settings.conflicting_seo_plugin
				? sprintf(
						/* translators: %s: name of the conflicting SEO plugin. */
						__( '%s must also be deactivated before editing is available.', 'jetpack-seo' ),
						settings.conflicting_seo_plugin
					)
				: disabledOutputHelp
		);
	} else {
		if ( settings.title_formats_editable ) {
			explanation.push( activeOutputHelp );
		} else if ( settings.has_legacy_front_page_meta ) {
			explanation.push( pausedTitlesAndSchemaHelp, legacyDescriptionHelp );
		} else {
			explanation.push( pausedOutputHelp );
		}
		if ( settings.canonical_conflicted ) {
			explanation.push( canonicalDisabledHelp );
		} else if ( settings.canonical_switchable ) {
			explanation.push( canonicalHelp );
		}
	}
	explanation.push( aiHelp );

	return (
		<UpsellBanner
			title={ __( 'Some SEO settings are locked', 'jetpack-seo' ) }
			description={ explanation.join( ' ' ) }
		/>
	);
};

export default SettingsPlanBanner;
