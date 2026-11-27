/**
 * External dependencies
 */
import { ButtonLink } from '@jetpack-premium-analytics/externals';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import type { PromoCtaVariant } from '@jetpack-premium-analytics/data';
import type { JSX } from 'react';

export type PromoCtaProps = {
	href: string;
	label: string;
	variant?: PromoCtaVariant;
	trackClick: () => void;
};

const BUTTON_VARIANTS: Record< PromoCtaVariant, 'solid' | 'outline' > = {
	primary: 'solid',
	secondary: 'outline',
};

/**
 * The call to action of a promo: a button-styled link that opens in a new tab.
 * Plain text when `href` is not http(s), so a bad URL cannot ship a `javascript:` link.
 *
 * @param {PromoCtaProps} props - The component props.
 * @return The link, or null when there is no label to show.
 */
export function PromoCta( {
	href,
	label,
	variant = 'primary',
	trackClick,
}: PromoCtaProps ): JSX.Element | null {
	if ( ! label ) {
		return null;
	}

	const safeHref = safeHttpUrl( href );

	if ( ! safeHref ) {
		return <span>{ label }</span>;
	}

	return (
		<ButtonLink
			href={ safeHref }
			variant={ BUTTON_VARIANTS[ variant ] }
			openInNewTab
			onClick={ trackClick }
		>
			{ label }
		</ButtonLink>
	);
}
