import { __ } from '@wordpress/i18n';
import { Card, Text } from '@wordpress/ui';
import './style.scss';
import type { ReactElement } from 'react';

/**
 * Quiet failure card shown in place of the KPI cards and trends chart
 * when the video-plays stats queries fail. Without it, a failed fetch
 * degrades to all-zero KPIs that are indistinguishable from a genuinely
 * zero-view period, so the screens replace the whole region instead of
 * rendering misleading zeros. Shared by the Overview and the per-video
 * Analytics screen; tone matches PagesCard's inline error state.
 *
 * @return The card element.
 */
export default function StatsErrorCard(): ReactElement {
	return (
		<Card.Root>
			<Card.Content>
				<div className="vp-stats-error-card__body" role="alert">
					<Text>
						{ __(
							'Could not load stats for this period. Try reloading the page.',
							'jetpack-videopress-pkg'
						) }
					</Text>
				</div>
			</Card.Content>
		</Card.Root>
	);
}
