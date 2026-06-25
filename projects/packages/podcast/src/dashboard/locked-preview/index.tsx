// Locked-preview UX for Episodes + Stats on free plans. Renders a blurred,
// non-language skeleton of the gated content behind a centered upgrade card.

import { getSiteData } from '@automattic/jetpack-script-data';
import { Button } from '@wordpress/components';
import { useId } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { buildUpgradeCheckoutUrl, getUpgradePlanName, withPurchaseReturnMarker } from '../upgrade';
import './style.scss';

export type LockedPreviewVariant = 'episodes' | 'stats';

interface LockedPreviewProps {
	variant: LockedPreviewVariant;
}

const Skeleton = () => <span className="podcast-locked-preview__cell-skeleton" />;

const LockedPreview = ( { variant }: LockedPreviewProps ) => {
	const planName = getUpgradePlanName();
	const returnUrl = window.location.href;
	// `getProductCheckoutUrl` sets `redirect_to`; the cart's close button reads
	// `cancel_to`. Both point back to the current dashboard view, but only the
	// post-purchase `redirect_to` carries the marker — a cancel shouldn't bust
	// the cache for an unchanged plan.
	const checkoutUrl = buildUpgradeCheckoutUrl( {
		siteSlug: getSiteData()?.suffix ?? '',
		returnUrl: withPurchaseReturnMarker( returnUrl ),
		params: { cancel_to: returnUrl },
		noSiteSlugUrl: 'https://wordpress.com/pricing',
	} );

	const titleId = useId();
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
		<div className="podcast-locked-preview" role="region" aria-labelledby={ titleId }>
			<div className="podcast-locked-preview__sample" aria-hidden="true">
				{ variant === 'episodes' ? (
					<table className="podcast-locked-preview__episodes">
						<thead>
							<tr>
								<th className="podcast-locked-preview__col-media" />
								{ [ 0, 1, 2, 3, 4 ].map( col => (
									<th key={ col }>
										<Skeleton />
									</th>
								) ) }
							</tr>
						</thead>
						<tbody>
							{ [ 0, 1, 2, 3, 4 ].map( row => (
								<tr key={ row }>
									<td className="podcast-locked-preview__col-media">
										<span className="podcast-locked-preview__thumb" />
									</td>
									<td>
										<span className="podcast-locked-preview__cell-skeleton podcast-locked-preview__cell-skeleton--wide" />
									</td>
									{ [ 0, 1, 2, 3 ].map( col => (
										<td key={ col }>
											<Skeleton />
										</td>
									) ) }
								</tr>
							) ) }
						</tbody>
					</table>
				) : (
					<div className="podcast-locked-preview__stats">
						<section className="podcast-locked-preview__module podcast-locked-preview__module--chart">
							<h3>
								<Skeleton />
							</h3>
							<div className="podcast-locked-preview__chart">
								{ [ 18, 32, 24, 45, 38, 52, 41, 60, 47, 55, 49, 63, 58, 70 ].map(
									( v, i, days ) => (
										<span
											key={ i }
											className="podcast-locked-preview__chart-bar"
											style={ {
												height: `${ ( v / Math.max( ...days ) ) * 100 }%`,
											} }
										/>
									)
								) }
							</div>
						</section>
						{ [ 0, 1 ].map( section => (
							<section key={ section } className="podcast-locked-preview__module">
								<h3>
									<Skeleton />
								</h3>
								<ul className="podcast-locked-preview__bar-list">
									{ [ 100, 76, 63, 47 ].map( ( pct, i ) => (
										<li key={ i }>
											<span
												className="podcast-locked-preview__bar"
												style={ { width: `${ pct }%` } }
											/>
										</li>
									) ) }
								</ul>
							</section>
						) ) }
					</div>
				) }
			</div>
			<div className="podcast-locked-preview__overlay">
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
			</div>
		</div>
	);
};

export default LockedPreview;
