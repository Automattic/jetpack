import { useAnalytics, useUpgradeFlow } from '@automattic/jetpack-shared-extension-utils';
import { Button, ExternalLink } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import clsx from 'clsx';
import './upsell.scss';

const UpsellNotice = ( { requiredPlan } ) => {
	const [ checkoutUrl, goToCheckoutPage, isRedirecting, planData ] = useUpgradeFlow( requiredPlan );
	const { tracks } = useAnalytics();

	// Define plan name, with a fallback value.
	const planName = planData?.product_name || __( 'paid', 'jetpack' );

	const buttonText = __( 'Upgrade now', 'jetpack' );
	const supportUrl = 'https://wordpress.com/support/seo-tools/';
	const supportLinkTitle = __( 'Learn more about the SEO feature.', 'jetpack' );

	const onClickHandler = event => {
		event.preventDefault();
		tracks.recordEvent( 'jetpack_seo_tools_upsell_click' );
		goToCheckoutPage( event );
	};

	const helpCenterDispatch = useDispatch( 'automattic/help-center' );
	const setShowHelpCenter = helpCenterDispatch?.setShowHelpCenter;
	const setShowSupportDoc = helpCenterDispatch?.setShowSupportDoc;

	return (
		<>
			<div>
				{ sprintf(
					/* translators: placeholder is the product name of the plan. */
					__( 'To use the SEO feature you need to upgrade to the %s plan', 'jetpack' ),
					planName
				) }
			</div>

			<div className="components-seo-upsell__learn-more">
				{ setShowHelpCenter ? (
					<Button
						onClick={ () => {
							setShowHelpCenter( true );
							setShowSupportDoc( supportUrl );
						} }
						className="components-seo-upsell__learn-more-link"
						variant="link"
					>
						{ supportLinkTitle }
					</Button>
				) : (
					<ExternalLink href={ supportUrl }>{ supportLinkTitle }</ExternalLink>
				) }
			</div>

			<Button
				href={ isRedirecting ? null : checkoutUrl } // Only for server-side rendering, since onClick doesn't work there.
				onClick={ onClickHandler }
				target="_top"
				icon={ external }
				className={ clsx( 'components-seo-upsell__button is-primary', {
					'jetpack-upgrade-plan__hidden': ! checkoutUrl,
				} ) }
				isBusy={ isRedirecting }
			>
				{ isRedirecting ? __( 'Redirecting…', 'jetpack' ) : buttonText }
			</Button>
		</>
	);
};

export default UpsellNotice;
