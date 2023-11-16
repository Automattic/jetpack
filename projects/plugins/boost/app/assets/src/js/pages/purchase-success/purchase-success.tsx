import { getRedirectUrl } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { createInterpolateElement, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { requestImageAnalysis } from '$features/image-size-analysis/lib/stores/isa-summary';
import enableCloudCss from '$lib/utils/enable-cloud-css';
import { navigate } from '$lib/utils/navigate';
import Logo from '$svg/jetpack-green';

type PurchaseSuccessProps = {
	isImageGuideActive: boolean;
};

const PurchaseSuccess: React.FC< PurchaseSuccessProps > = ( { isImageGuideActive } ) => {
	useEffect( () => {
		enableCloudCss();

		// If image guide is enabled, request a new ISA report.
		if ( isImageGuideActive && false !== Jetpack_Boost.site.canResizeImages ) {
			requestImageAnalysis();
		}
	}, [ isImageGuideActive ] );

	const wpcomPricingUrl = getRedirectUrl( 'wpcom-pricing' );

	return (
		<div id="jb-dashboard" className="jb-dashboard">
			<div className="jb-container jb-container--fixed mt-2">
				<div className="jb-card">
					<div className="jb-card__content">
						<Logo className="my-2" />
						<h1 className="my-2">
							{ __( 'Your Jetpack Boost has been upgraded!', 'jetpack-boost' ) }
						</h1>
						<p className="jb-card__summary my-2">
							{ __(
								'Your site now auto-generates Critical CSS and can analyze image sizes for efficient display.',
								'jetpack-boost'
							) }
						</p>
						<ul className="jb-checklist my-2">
							<li>{ __( 'Automatic critical CSS regeneration', 'jetpack-boost' ) }</li>
							<li>
								{ __( 'Performance scores are recalculated after each change', 'jetpack-boost' ) }
							</li>
							<li>
								{ __( 'Automatically scan your site for image size issues', 'jetpack-boost' ) }
							</li>
							<li>
								{ __( 'Historical performance scores with Core Web Vitals data', 'jetpack-boost' ) }
							</li>

							<li>
								{ Jetpack_Boost.site.isAtomic
									? createInterpolateElement(
											__(
												`Dedicated email support plus priority Live Chat if <link>your plan</link> includes <strong>Premium Support</strong>`,
												'jetpack-boost'
											),
											{
												link: (
													// eslint-disable-next-line jsx-a11y/anchor-has-content
													<a className="action" href={ wpcomPricingUrl } />
												),
												strong: <strong />,
											}
									  )
									: __( 'Dedicated email support', 'jetpack-boost' ) }
							</li>
						</ul>
						<Button
							label={ __( 'Continue', 'jetpack-boost' ) }
							onClick={ () => navigate( '/' ) }
							className="jp-action-button--button jb-button jb-button--primary mt-3"
							children={ __( 'Continue', 'jetpack-boost' ) }
						/>
					</div>

					<div className="jb-card__cta px-1 py-4">
						<img
							src={ `${ Jetpack_Boost.site.assetPath }../static/images/boost.png` }
							alt={ __( 'Optimize with Jetpack Boost', 'jetpack-boost' ) }
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PurchaseSuccess;
