import { getAdminUrl } from '@automattic/jetpack-script-data';
import { __, sprintf } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import getOutput from '../data/get-output';
import type { FC } from 'react';

// Module scope, so the production minifier can't fold the two messages into one
// `__()` call. See feedback_i18n_ternary_minifier_fold.
const turnedOffLabel = __(
	'Jetpack’s SEO output is turned off on this site. Your saved settings are kept.',
	'jetpack-seo'
);

/**
 * The page-level banner every tab shows while Jetpack's SEO output is paused, naming
 * the SEO plugin that manages the site's SEO when there is one. It is the only place
 * the cause is explained: the locked cards below it show the short `PausedNote`.
 *
 * @param props           - Component props.
 * @param props.className - Optional class for the tab's spacing.
 * @return The banner, or null while the output is live.
 */
const SeoPausedBanner: FC< { className?: string } > = ( { className } ) => {
	const { paused, conflicting_plugin: plugin } = getOutput();

	if ( ! paused ) {
		return null;
	}

	return (
		<Notice.Root intent="warning" className={ className }>
			<Notice.Description>
				{ plugin
					? sprintf(
							/* translators: %1$s: name of the SEO plugin that manages the site's SEO, e.g. Yoast SEO. */
							__(
								'%1$s is managing your site’s SEO, so Jetpack’s SEO output is paused. Your saved settings are kept. Deactivate %1$s to use them.',
								'jetpack-seo'
							),
							plugin
						)
					: turnedOffLabel }
			</Notice.Description>
			{ plugin && (
				<Notice.Actions>
					<Notice.ActionLink href={ getAdminUrl( 'plugins.php' ) }>
						{ __( 'Manage plugins', 'jetpack-seo' ) }
					</Notice.ActionLink>
				</Notice.Actions>
			) }
		</Notice.Root>
	);
};

export default SeoPausedBanner;
