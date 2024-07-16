import { __, _n, sprintf } from '@wordpress/i18n';
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
				/* translators: %1$s the singular or plural of number of plugin(s), and %2$s is the singular or plural of the number of theme(s). */
				__(
					'Your site has %1$s and %2$s lacking security measures. Improve your site’s safety by adding protection at no cost.',
					'jetpack-my-jetpack'
				),
				sprintf(
					/* translators: %d is the number of plugins installed on the site. */
					_n( '%d plugin', '%d plugins', pluginsCount, 'jetpack-my-jetpack' ),
					pluginsCount
				),
				sprintf(
					/* translators: %d is the number of themes installed on the site. */
					_n( '%d theme', '%d themes', themesCount, 'jetpack-my-jetpack' ),
					themesCount
				)
			),
		},
		scanThreatsTooltip:
			hasProtectPaidPlan && numThreats
				? {
						title: __( 'Auto-fix threats', 'jetpack-my-jetpack' ),
						text: sprintf(
							/* translators: %s is the singular or plural of number of detected critical threats on the site. */
							__(
								'The last scan identified %s. But don’t worry, use the “Auto-fix” button in the product to automatically fix most threats.',
								'jetpack-my-jetpack'
							),
							sprintf(
								/* translators: %d is the number of detected scan threats on the site. */
								_n(
									'%d critical threat.',
									'%d critical threats.',
									numThreats,
									'jetpack-my-jetpack'
								),
								numThreats
							)
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
