import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
import { Text } from '@wordpress/ui';

type Stat = {
	label: string;
	value: string;
	/** Shown behind an info icon, for a figure whose name isn't self-explanatory. */
	hint?: string;
};

type Props = {
	totalSubscribers: number | null;
	openRate: number | null;
	clickRate: number | null;
	ctor: number | null;
};

const formatCount = ( value: number | null ): string => value?.toLocaleString() ?? '—';

const formatRate = ( value: number | null ): string =>
	value?.toLocaleString( undefined, {
		style: 'percent',
		maximumFractionDigits: 0,
	} ) ?? '—';

/**
 * The four headline figures.
 *
 * A function rather than a module constant so each `__()` runs at render time —
 * at module scope they would resolve before the locale data is in place.
 *
 * @param totalSubscribers - Total subscriber count, or null when unavailable.
 * @param openRate         - Open rate as a fraction, or null when unavailable.
 * @param clickRate        - Click rate as a fraction, or null when unavailable.
 * @param ctor             - Click-to-open rate as a fraction, or null when unavailable.
 * @return The stats, in display order.
 */
const getStats = (
	totalSubscribers: number | null,
	openRate: number | null,
	clickRate: number | null,
	ctor: number | null
): Stat[] => [
	{
		label: __( 'Total subscribers', 'jetpack-newsletter' ),
		value: formatCount( totalSubscribers ),
	},
	{
		label: __( 'Open rate', 'jetpack-newsletter' ),
		value: formatRate( openRate ),
	},
	{
		label: __( 'Click rate', 'jetpack-newsletter' ),
		value: formatRate( clickRate ),
	},
	{
		label: __( 'CTOR', 'jetpack-newsletter' ),
		value: formatRate( ctor ),
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
 * @param props                  - Component props.
 * @param props.totalSubscribers - Total subscriber count, or null when unavailable.
 * @param props.openRate         - Open rate as a fraction, or null when unavailable.
 * @param props.clickRate        - Click rate as a fraction, or null when unavailable.
 * @param props.ctor             - Click-to-open rate as a fraction, or null when unavailable.
 * @return The stat bar.
 */
export const StatBar = ( { totalSubscribers, openRate, clickRate, ctor }: Props ): JSX.Element => (
	<div
		className="jetpack-newsletter-home__stat-bar"
		role="group"
		aria-label={ __( 'Newsletter performance', 'jetpack-newsletter' ) }
	>
		{ getStats( totalSubscribers, openRate, clickRate, ctor ).map( stat => (
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
