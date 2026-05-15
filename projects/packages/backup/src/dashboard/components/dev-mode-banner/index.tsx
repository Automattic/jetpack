import { __ } from '@wordpress/i18n';
import { useIsMockMode } from '../../hooks/use-is-mock-mode';
import './style.scss';

/**
 * Banner shown above the dashboard body when fixture/mock data is active.
 *
 * Renders nothing in normal mode; only appears when the URL has `?jpb-mock=1`
 * so contributors can tell at a glance that the page is not making real requests.
 *
 * @return The rendered banner, or `null` when mock mode is off.
 */
export default function DevModeBanner() {
	const isMock = useIsMockMode();
	if ( ! isMock ) {
		return null;
	}
	return (
		<div className="jpb-dev-mode-banner" role="status">
			{ __(
				"Dev mode: the backup list below is fixture data ('?jpb-mock=1'). No real requests are being made.",
				'jetpack-backup-pkg'
			) }
		</div>
	);
}
