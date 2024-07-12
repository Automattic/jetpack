import { __, sprintf } from '@wordpress/i18n';
import useProduct from '../../../data/products/use-product';
import type { ReactElement } from 'react';

type TooltipType = 'pluginsThemesTooltip' | 'scanThreatsTooltip';
export type TooltipContent = {
	[ key in TooltipType ]: {
		title: ReactElement | string;
		text: ReactElement | string;
	};
};

/**
 * Gets the translated tooltip copy based on Protect Scan details.
 *
 * @param {object} props - React props
 * @param {number} props.pluginsCount - The number of installed plugins on the site.
 * @param {number} props.themesCount - The number of installed themes on the site.
 * @param {number} props.numThreats - The number of detected scan threats on the site.
 * @returns {TooltipContent} An object containing each tooltip's title and text content.
 */
export function useProtectTooltipCopy( {
	pluginsCount = 0,
	themesCount = 0,
	numThreats = 0,
}: {
	pluginsCount: number;
	themesCount: number;
	numThreats: number;
} ): TooltipContent {
	const slug = 'protect';
	const { detail } = useProduct( slug );
	const { hasPaidPlanForProduct: hasProtectPaidPlan } = detail;

	return {
		pluginsThemesTooltip: {
			title: __( 'Improve site safety: secure plugins & themes', 'jetpack-my-jetpack' ),
			text: sprintf(
				/* translators: %1$d is the number of plugins and %2$d is the number of themes installed on the site. */
				__(
					'Your site has %1$d plugins and %2$d themes lacking security measures. Improve your site’s safety by adding protection at no cost.',
					'jetpack-my-jetpack'
				),
				pluginsCount,
				themesCount
			),
		},
		scanThreatsTooltip:
			hasProtectPaidPlan && numThreats
				? {
						title: __( 'Auto-fix threats', 'jetpack-my-jetpack' ),
						text: sprintf(
							/* translators: %d is the number of detected scan threats on the site. */
							__(
								'The last scan identified %d critical threats. But don’t worry, use the “Auto-fix” button in the product to automatically fix most threats.',
								'jetpack-my-jetpack'
							),
							numThreats
						),
				  }
				: {
						title: __( 'Elevate your malware protection', 'jetpack-my-jetpack' ),
						text: __(
							'We’ve checked items against our database, and all appears well. For a more detailed, line-by-line malware scan, consider upgrading your plan.',
							'jetpack-my-jetpack'
						),
				  },
	};
}
