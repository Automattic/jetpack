import { __ } from '@wordpress/i18n';
import useProduct from '../../../data/products/use-product';

export const useBoostTooltipCopy = ( { speedLetterGrade } ): string => {
	const slug = 'boost';
	const { detail } = useProduct( slug );
	const { isPluginActive, hasPaidPlanForProduct } = detail;

	// Boost plugin is active
	if ( isPluginActive ) {
		//  Has a paid Boost plan
		if ( hasPaidPlanForProduct ) {
			switch ( speedLetterGrade ) {
				case 'A':
					return __(
						'Your site is fast! Boost is working to enhance your performance with automated tools.',
						'jetpack-my-jetpack'
					);
				case 'B':
				case 'C':
				case 'D':
				case 'E':
				case 'F':
					return __(
						'Visit the Boost dashboard to view your historical speed scores and manage your product settings.',
						'jetpack-my-jetpack'
					);
				// This case is here to prevent build optimization minification breaking the build.
				default:
					return __(
						'Visit the Boost dashboard to view your site’s speed scores and manage your product settings.',
						'jetpack-my-jetpack'
					);
			}
		}
		// Has the Free Boost plan
		switch ( speedLetterGrade ) {
			case 'A':
				return __(
					'Your site is fast! But maintaining a high speed isn’t easy. Upgrade Boost to use automated CCS and image optimization tools to improve your performance on the go.',
					'jetpack-my-jetpack'
				);
			case 'B':
				return __(
					'You are one step away from making your site blazing fast. Upgrade Boost to use automated CCS and image optimization tools to improve your performance.',
					'jetpack-my-jetpack'
				);
			default:
				return __(
					'Improve your performance with automated CSS and image optimization tools by upgrading Boost.',
					'jetpack-my-jetpack'
				);
		}
	}
	// Boost plugin not active
	switch ( speedLetterGrade ) {
		case 'A':
			return __(
				'Your site is fast! But maintaining a high speed isn’t easy. Use Boost’s automated acceleration tools to optimize your performance on the go.',
				'jetpack-my-jetpack'
			);
		case 'B':
			return __(
				'You are one step away from making your site blazing fast. Install Boost to enhance your site’s performance like top websites, no developer needed.',
				'jetpack-my-jetpack'
			);
		default:
			return __(
				'Your site needs performance improvements. Make your site blazing fast with Boost’s simple dashboard and acceleration tools.',
				'jetpack-my-jetpack'
			);
	}
};
