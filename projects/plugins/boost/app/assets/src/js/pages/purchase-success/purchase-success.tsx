import { getRedirectUrl } from '@automattic/jetpack-components';
import { Button, ExternalLink } from '@wordpress/components';
import { createInterpolateElement, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useImageAnalysisRequest } from '$features/image-size-analysis';
import { useSingleModuleState } from '$features/module/lib/stores';
import { useNavigate } from 'react-router-dom';
import CardPage from '$layout/card-page/card-page';
import styles from './purchase-success.module.scss';

const PurchaseSuccess: React.FC = () => {
	const [ , setCloudCssState ] = useSingleModuleState( 'cloud_css' );
	const [ imageGuideState ] = useSingleModuleState( 'image_guide' );
	const [ isaState ] = useSingleModuleState( 'image_size_analysis' );
	const navigate = useNavigate();
	const isaRequest = useImageAnalysisRequest();
	const { site, canResizeImages } = Jetpack_Boost;

	useEffect( () => {
		setCloudCssState( true );
		// If image guide is enabled, request a new ISA report.
		if ( imageGuideState?.active && isaState?.active && false !== canResizeImages ) {
			isaRequest.requestNewReport();
		}
		// We only want this effect to run on mount.
		// Specifying the dependencies will cause it to run on every render (infinite loop).
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const wpcomPricingUrl = getRedirectUrl( 'wpcom-pricing' );
	const boostSupport = getRedirectUrl( 'jetpack-support-boost' );

	return (
		<CardPage
			showActivateLicense={ false }
			showBackButton={ false }
			sidebarItem={
				<img
					src={ `${ Jetpack_Boost.assetPath }../static/images/boost.png` }
					alt={ __( 'Optimize with Jetpack Boost', 'jetpack-boost' ) }
				/>
			}
		>
			<h1 className="my-3">
				{ __( 'Congratulations! Your Jetpack Boost is Now Upgraded!', 'jetpack-boost' ) }
			</h1>
			<h3 className="my-2">
				{ __(
					'You’ve just unlocked powerful premium features. To boost your site speed score, here’s what you can now do:',
					'jetpack-boost'
				) }
			</h3>
			<ul className="my-2">
				<li>
					{ createInterpolateElement(
						__(
							'<strong>Automatic Critical CSS:</strong> No further action needed! Your Critical CSS is now set to auto-regenerate.',
							'jetpack-boost'
						),
						{
							strong: <strong />,
						}
					) }
				</li>
				<li>
					{ createInterpolateElement(
						__(
							'<strong>Image Size Analyzer:</strong> Scan and identify oversized images. Optimize them to boost loading speeds.',
							'jetpack-boost'
						),
						{
							strong: <strong />,
						}
					) }
				</li>
				<li>
					{ createInterpolateElement(
						__(
							'<strong>Historical Performance:</strong> Review past performance scores and Core Web Vitals data. Identify which actions positively impacted site speeds over time.',
							'jetpack-boost'
						),
						{
							strong: <strong />,
						}
					) }
				</li>
				<li>
					{ createInterpolateElement(
						__(
							'<strong>Image CDN Quality Control:</strong> Fine-tune your image quality to balance clarity and loading speed. Choose the level of detail that aligns with your site’s needs.',
							'jetpack-boost'
						),
						{
							strong: <strong />,
						}
					) }
				</li>

				<li>
					{ site.isAtomic
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
			<p className={ styles[ 'last-paragraph' ] }>
				<ExternalLink href={ boostSupport }>
					{ __( 'Learn more about Boost features and upgrades', 'jetpack-boost' ) }
				</ExternalLink>
			</p>
			<Button
				label={ __( 'Continue', 'jetpack-boost' ) }
				onClick={ () => navigate( '/' ) }
				className="jp-action-button--button jb-button jb-button--primary mt-3"
			>
				{ __( 'Continue', 'jetpack-boost' ) }
			</Button>
		</CardPage>
	);
};

export default PurchaseSuccess;
