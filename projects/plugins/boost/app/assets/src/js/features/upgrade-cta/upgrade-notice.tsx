import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { recordBoostEvent } from '$lib/utils/analytics';

type UpgradeNoticeProps = {
	identifier: string;
	description: string;
	actionLabel?: string;
};

/**
 * Inline upsell rendered inside a free-tier module.
 *
 * Composes WPDS `Notice.Root intent="info"` with an `ActionLink` that
 * routes to the My Jetpack add-Boost flow keyed by feature identifier
 * (e.g. `add-boost-critical-css`). Click tracking matches the legacy
 * `UpgradeCTA` so analytics dashboards keep working unchanged.
 *
 * @param props
 * @param props.identifier  Feature slug used in the My Jetpack add-Boost route.
 * @param props.description Body copy for the notice.
 * @param props.actionLabel Optional action link label. Defaults to "Upgrade now".
 */
export default function UpgradeNotice( {
	identifier,
	description,
	actionLabel,
}: UpgradeNoticeProps ) {
	// Stay silent on unreachable sites — matches legacy `UpgradeCTA` behavior.
	if ( ! Jetpack_Boost.site.online ) {
		return null;
	}

	const handleClick = () => {
		recordBoostEvent( 'upsell_cta_from_settings_page_in_plugin', { identifier } );
	};

	return (
		<Notice.Root intent="info">
			<Notice.Description>{ description }</Notice.Description>
			<Notice.Actions>
				<Notice.ActionLink
					href={ `admin.php?page=my-jetpack#/add-boost-${ identifier }` }
					onClick={ handleClick }
				>
					{ actionLabel ?? __( 'Upgrade now', 'jetpack-boost' ) }
				</Notice.ActionLink>
			</Notice.Actions>
		</Notice.Root>
	);
}
