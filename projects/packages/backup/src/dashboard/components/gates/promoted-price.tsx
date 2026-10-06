import { formatCurrency } from '@automattic/number-formatters';
import { VisuallyHidden } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { usePromotedProduct } from '../../hooks/use-promoted-product';

/**
 * What a Backup subscription costs, for the no-plan screen.
 *
 * Renders nothing until a price is known, and nothing at all if one
 * never arrives. That is deliberate: this screen is the only purchase
 * path a site without Backup has, and a catalogue that is slow or down
 * must not be able to delay or withhold the button that leads to
 * checkout. The price is an argument for pressing it, not a
 * precondition.
 *
 * @return The price block, or null while there is no price to show.
 */
export default function PromotedPrice() {
	const { monthlyPrice, introMonthlyPrice, introYears, currencyCode } = usePromotedProduct();

	if ( monthlyPrice === null || ! currencyCode ) {
		return null;
	}

	const effectivePrice =
		introMonthlyPrice !== null && introMonthlyPrice < monthlyPrice
			? introMonthlyPrice
			: monthlyPrice;

	const fullText = formatCurrency( monthlyPrice, currencyCode );
	const effectiveText = formatCurrency( effectivePrice, currencyCode );

	// Compared as rendered, not as numbers. Two amounts that differ below
	// the currency's precision format identically, and striking through a
	// figure to show the same one again reads as a bug rather than a
	// saving.
	const hasDiscount = effectiveText !== fullText;

	const priceDetails =
		hasDiscount && introYears !== null
			? // The singular has no placeholder, which is the standard `_n()` idiom for "one".
				// eslint-disable-next-line @wordpress/valid-sprintf
				sprintf(
					/* translators: %d is the number of years the introductory price lasts. */
					_n(
						'per month for the first year, billed yearly',
						'per month for the first %d years, billed yearly',
						introYears,
						'jetpack-backup-pkg'
					),
					introYears
				)
			: __( 'per month, billed yearly', 'jetpack-backup-pkg' );

	// The struck-through figure is hidden from assistive tech, so this restores the renewal amount.
	// It says nothing about *when* it renews: the offer's interval is not always a year.
	const renewalText = sprintf(
		/* translators: %s is the full monthly price the subscription renews at. */
		__( 'Renews at %s per month.', 'jetpack-backup-pkg' ),
		fullText
	);

	return (
		<Stack direction="column" gap="xs" align="start">
			<Text variant="heading-2xl">{ effectiveText }</Text>
			<Text className="jpb-text-muted">
				{ /*
				 * Hidden from assistive tech rather than read out. A
				 * strikethrough carries no meaning a screen reader
				 * conveys, so announcing it gives two bare amounts and no
				 * hint which one is charged.
				 *
				 * Hiding it is only half the fix: the amount itself is
				 * restored below as visually-hidden text.
				 */ }
				{ hasDiscount && (
					<>
						<s aria-hidden="true">{ fullText }</s>{ ' ' }
					</>
				) }
				{ priceDetails }
			</Text>
			{ hasDiscount && <VisuallyHidden>{ renewalText }</VisuallyHidden> }
		</Stack>
	);
}
