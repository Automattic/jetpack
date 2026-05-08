import { getRedirectUrl, Button } from '@automattic/jetpack-components';
import { createInterpolateElement, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { useSingleModuleState } from '$features/module/lib/stores';
import { useNavigate } from 'react-router';
import CardPage from '$layout/card-page/card-page';
import styles from './purchase-success.module.scss';
import { isWoaHosting } from '$lib/utils/hosting';
import type { FC } from 'react';

const PurchaseSuccess: FC = () => {
	const [ , setCloudCssState ] = useSingleModuleState( 'cloud_css' );
	const navigate = useNavigate();

	useEffect( () => {
		setCloudCssState( true );
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
					{ isWoaHosting()
						? createInterpolateElement(
								__(
									`Dedicated email support plus priority Live Chat if <link>your plan</link> includes <strong>Premium Support</strong>`,
									'jetpack-boost'
								),
								{
									link: <Link openInNewTab href={ wpcomPricingUrl } />,
									strong: <strong />,
								}
						  )
						: __( 'Dedicated email support', 'jetpack-boost' ) }
				</li>
			</ul>
			<p className={ styles[ 'last-paragraph' ] }>
				<Link openInNewTab href={ boostSupport }>
					{ __( 'Learn more about Boost features and upgrades', 'jetpack-boost' ) }
				</Link>
			</p>
			<Button
				label={ __( 'Continue', 'jetpack-boost' ) }
				variant="primary"
				onClick={ () => navigate( '/' ) }
				className="mt-3"
			>
				{ __( 'Continue', 'jetpack-boost' ) }
			</Button>
		</CardPage>
	);
};

export default PurchaseSuccess;
