/**
 * External dependencies
 */
import { formatNumberCompact } from '@automattic/number-formatters';
import { Stack, Text } from '@jetpack-premium-analytics/externals';
import { formatMonthlyPrice } from '@jetpack-premium-analytics/formatters';
import { RangeControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import styles from './stats-tier-slider.module.scss';
import type { StatsUpgradeTier } from '@jetpack-premium-analytics/data';

// Classic Stats' first tier; a higher first tier means the site's tier or usage set the floor.
const FIRST_TIER_VIEWS = 10000;

export interface StatsTierSliderProps {
	/** The tiers to pick from, cheapest first; see `useStatsUpgradeTiers()`. */
	tiers: StatsUpgradeTier[];
	currencyCode: string;
	/** The index of the selected tier. */
	value: number;
	onChange: ( index: number ) => void;
}

/**
 * Pick a Stats tier by its monthly views limit, with the monthly price it costs.
 *
 * @param props              - The component props.
 * @param props.tiers        - The tiers to pick from.
 * @param props.currencyCode - The prices' currency.
 * @param props.value        - The index of the selected tier.
 * @param props.onChange     - Called with the index of the picked tier.
 * @return The slider, or nothing without tiers.
 */
export function StatsTierSlider( { tiers, currencyCode, value, onChange }: StatsTierSliderProps ) {
	const handleChange = useCallback( ( next?: number ) => onChange( next ?? 0 ), [ onChange ] );
	const lastIndex = tiers.length - 1;
	const index = Math.min( Math.max( value, 0 ), lastIndex );
	const tier = tiers[ index ];

	if ( ! tier ) {
		return null;
	}

	const viewsLabel = formatNumberCompact( tier.views );
	const price = formatMonthlyPrice( tier.price, currencyCode );
	const payable =
		tier.upgradePrice > 0 ? formatMonthlyPrice( tier.upgradePrice, currencyCode ) : price;
	const perUnitFee = tiers[ lastIndex ].perUnitFee;

	let note: string | undefined;
	if ( index === 0 && tier.views > FIRST_TIER_VIEWS ) {
		note = __(
			'The minimum views limit is set by your current tier and usage.',
			'jetpack-premium-analytics-pkg'
		);
	} else if ( index === lastIndex && perUnitFee ) {
		note = sprintf(
			/* translators: %s: a monthly price, e.g. "$20.84". */
			__(
				'Beyond 1 million, we’ll charge an extra %s per million views per month.',
				'jetpack-premium-analytics-pkg'
			),
			formatMonthlyPrice( perUnitFee, currencyCode )
		);
	}

	return (
		<Stack direction="column" gap="md">
			<Stack direction="row" justify="space-between" gap="md">
				<Stack direction="column" gap="xs">
					<Text variant="body-md" className={ styles.label }>
						{ __( 'Monthly views limit', 'jetpack-premium-analytics-pkg' ) }
					</Text>
					<Text variant="heading-2xl">{ viewsLabel }</Text>
				</Stack>
				<Stack direction="column" gap="xs" align="end">
					<Text variant="body-md" className={ styles.label }>
						{ __( 'You’ll pay', 'jetpack-premium-analytics-pkg' ) }
					</Text>
					<Text variant="heading-2xl">
						{ tier.upgradePrice > 0 ? (
							<>
								<s className={ styles.fullPrice }>{ price }</s> { payable }
							</>
						) : (
							price
						) }
					</Text>
				</Stack>
			</Stack>
			{ tiers.length > 1 && (
				<RangeControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Monthly views limit', 'jetpack-premium-analytics-pkg' ) }
					hideLabelFromVision
					min={ 0 }
					max={ lastIndex }
					step={ 1 }
					marks
					withInputField={ false }
					showTooltip={ false }
					value={ index }
					// The value is a tier index, which would be read out as "0", "1", …
					aria-valuetext={ sprintf(
						/* translators: %1$s: a views limit, e.g. "100K"; %2$s: a monthly price, e.g. "$16.67". */
						__( '%1$s views per month, %2$s', 'jetpack-premium-analytics-pkg' ),
						viewsLabel,
						payable
					) }
					onChange={ handleChange }
				/>
			) }
			<Text variant="body-md" className={ styles.caption }>
				{ __( 'Price per month, billed yearly*', 'jetpack-premium-analytics-pkg' ) }
			</Text>
			{ note && <Text variant="body-sm">{ note }</Text> }
		</Stack>
	);
}
