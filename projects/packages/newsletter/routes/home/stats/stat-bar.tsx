import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import { Text } from '@wordpress/ui';
import { HEADLINE_STATS } from './placeholder-data';

type Stat = {
	label: string;
	value: string;
	/** Shown behind an info icon, for a figure whose name isn't self-explanatory. */
	hint?: string;
};

/**
 * The four headline figures.
 *
 * A function rather than a module constant so each `__()` runs at render time —
 * at module scope they would resolve before the locale data is in place.
 *
 * @return The stats, in display order.
 */
const getStats = (): Stat[] => [
	{
		label: __( 'Total subscribers', 'jetpack-newsletter' ),
		value: HEADLINE_STATS.subscribers,
	},
	{
		label: __( 'Open rate', 'jetpack-newsletter' ),
		value: HEADLINE_STATS.openRate,
	},
	{
		label: __( 'Click rate', 'jetpack-newsletter' ),
		value: HEADLINE_STATS.clickRate,
	},
	{
		label: __( 'CTOR', 'jetpack-newsletter' ),
		value: HEADLINE_STATS.ctor,
		hint: __(
			'Click-to-open rate: the share of people who opened an email and then clicked a link in it.',
			'jetpack-newsletter'
		),
	},
];

/**
 * The headline stat bar across the top of the stats Dashboard.
 *
 * One bordered surface split into columns rather than four separate cards, so
 * the figures read as one row — the dividers between them come from the
 * stylesheet.
 *
 * @return The stat bar.
 */
export const StatBar = (): JSX.Element => (
	<div
		className="jetpack-newsletter-home__stat-bar"
		role="group"
		aria-label={ __( 'Newsletter performance', 'jetpack-newsletter' ) }
	>
		{ getStats().map( stat => (
			<div className="jetpack-newsletter-home__stat" key={ stat.label }>
				<Text variant="body-sm" className="jetpack-newsletter-home__stat-label">
					{ stat.label }
					{ stat.hint && (
						<Icon
							icon={ info }
							size={ 16 }
							className="jetpack-newsletter-home__stat-hint"
							// The icon is decorative; the explanation itself is the label,
							// so it reaches a screen reader as well as a hover tooltip.
							aria-label={ stat.hint }
							role="img"
						/>
					) }
				</Text>
				<Text
					variant="heading-2xl"
					render={ <span /> }
					className="jetpack-newsletter-home__stat-value"
				>
					{ stat.value }
				</Text>
			</div>
		) ) }
	</div>
);
