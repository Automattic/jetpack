import { formatCurrency } from '@automattic/number-formatters';
import { __ } from '@wordpress/i18n';
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
	const { monthlyPrice, introMonthlyPrice, currencyCode } = usePromotedProduct();

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

	// Every string here is the legacy no-plan card's, unchanged, so they
	// arrive already translated instead of waiting a GlotPress cycle.
	//
	// One const per string, rather than a `__()` call chosen inside a
	// ternary: the minifier factors the shared call out and leaves the
	// msgid a variable, which the text-domain scanner then drops.
	const basicInfoText = __( '14 day money back guarantee.', 'jetpack-backup-pkg' );
	const introductoryInfoText = __(
		'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
		'jetpack-backup-pkg'
	);
	const infoText = hasDiscount ? introductoryInfoText : basicInfoText;
	const priceDetails = __( 'per month, billed yearly', 'jetpack-backup-pkg' );

	return (
		<Stack direction="column" gap="xs" align="center">
			<Stack direction="row" gap="xs" align="baseline" justify="center" wrap="wrap">
				{ /*
				 * Hidden from assistive tech rather than read out. A
				 * strikethrough carries no meaning a screen reader
				 * conveys, so announcing it gives two bare amounts and no
				 * hint which one is charged. The sentence below says what
				 * the strikethrough means in words, which is the accessible
				 * version of the same information.
				 */ }
				{ hasDiscount && (
					<Text variant="body-lg" render={ <s /> } aria-hidden="true">
						{ fullText }
					</Text>
				) }
				<Text variant="heading-lg">{ effectiveText }</Text>
			</Stack>
			<Text variant="body-sm">{ priceDetails }</Text>
			<Text variant="body-sm">{ infoText }</Text>
		</Stack>
	);
}
