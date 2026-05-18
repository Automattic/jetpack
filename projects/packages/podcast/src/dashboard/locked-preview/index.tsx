// Locked-preview UX for Episodes + Stats on free plans. Renders a blurred,
// non-language skeleton of the gated content behind a centered upgrade card.

import { getProductCheckoutUrl } from '@automattic/jetpack-components';
import { getSiteData } from '@automattic/jetpack-script-data';
import { Button } from '@wordpress/components';
import { useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './style.scss';

export type LockedPreviewVariant = 'episodes' | 'stats';

interface LockedPreviewProps {
	variant: LockedPreviewVariant;
}

const Skeleton = () => <span className="podcast-locked-preview__cell-skeleton" />;

const LockedPreview = ( { variant }: LockedPreviewProps ) => {
	const siteSuffix = getSiteData()?.suffix ?? '';
	const returnUrl = window.location.href;
	const checkoutUrl = ( () => {
		if ( ! siteSuffix ) {
			return 'https://wordpress.com/pricing';
		}
		// `getProductCheckoutUrl` sets `redirect_to`; the cart's close button
		// reads `cancel_to`, so both need to point back to the dashboard.
		const url = new URL( getProductCheckoutUrl( 'premium', siteSuffix, returnUrl, true ) );
		url.searchParams.set( 'cancel_to', returnUrl );
		return url.toString();
	} )();

	const titleId = useId();
	const title =
		variant === 'episodes'
			? __( 'Episode dashboard included with Premium', 'jetpack-podcast' )
			: __( 'Episode stats included with Premium', 'jetpack-podcast' );
	const description =
		variant === 'episodes'
			? __(
					'Upgrade to Premium to manage your podcast catalog from a unified dashboard.',
					'jetpack-podcast'
			  )
			: __(
					'Upgrade to Premium to see downloads by episode, app, and country.',
					'jetpack-podcast'
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
						{ __( 'Upgrade to Premium', 'jetpack-podcast' ) }
					</Button>
				</div>
			</div>
		</div>
	);
};

export default LockedPreview;
