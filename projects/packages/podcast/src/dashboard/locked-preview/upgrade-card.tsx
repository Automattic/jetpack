// Centered upgrade card for the locked-preview overlay. Owns the screen when
// shown, so the CTA autofocuses. The title id is supplied by the parent so the
// surrounding region can label itself with it.

import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { getDashboardUpgradeUrl, getUpgradePlanName } from '../upgrade';

export type UpgradeCardVariant = 'episodes' | 'stats';

interface UpgradeCardProps {
	variant: UpgradeCardVariant;
	titleId: string;
}

const UpgradeCard = ( { variant, titleId }: UpgradeCardProps ) => {
	const planName = getUpgradePlanName();
	const checkoutUrl = getDashboardUpgradeUrl();

	const title =
		variant === 'episodes'
			? sprintf(
					/* translators: %s is the plan name, e.g. "Growth" or "Premium". */
					__( 'Episode dashboard included with %s', 'jetpack-podcast' ),
					planName
			  )
			: sprintf(
					/* translators: %s is the plan name, e.g. "Growth" or "Premium". */
					__( 'Episode stats included with %s', 'jetpack-podcast' ),
					planName
			  );
	const description =
		variant === 'episodes'
			? sprintf(
					/* translators: %s is the plan name, e.g. "Growth" or "Premium". */
					__(
						'Upgrade to %s to manage your podcast catalog from a unified dashboard.',
						'jetpack-podcast'
					),
					planName
			  )
			: sprintf(
					/* translators: %s is the plan name, e.g. "Growth" or "Premium". */
					__( 'Upgrade to %s to see downloads by episode, app, and country.', 'jetpack-podcast' ),
					planName
			  );

	return (
		<div className="podcast-locked-preview__card">
			<h2 id={ titleId } className="podcast-locked-preview__title">
				{ title }
			</h2>
			<p className="podcast-locked-preview__description">{ description }</p>
			<Button
				variant="primary"
				href={ checkoutUrl }
				className="podcast-locked-preview__cta"
				// eslint-disable-next-line jsx-a11y/no-autofocus
				autoFocus
			>
				{ sprintf(
					/* translators: %s is the plan name, e.g. "Growth" or "Premium". */
					__( 'Upgrade to %s', 'jetpack-podcast' ),
					planName
				) }
			</Button>
		</div>
	);
};

export default UpgradeCard;
