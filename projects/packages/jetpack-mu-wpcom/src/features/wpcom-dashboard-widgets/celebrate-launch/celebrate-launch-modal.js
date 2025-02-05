import { Gridicon, ConfettiAnimation } from '@automattic/components';
import { Button, Modal, Tooltip } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useState, useEffect, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, copy } from '@wordpress/icons';
import { wpcomTrackEvent } from '../../../common/tracks';

import './celebrate-launch-modal.scss';

/**
 * CelebrateLaunchModal component
 *
 * @param {object}   props                 - Props.
 * @param {Function} props.onRequestClose  - Callback on modal close.
 * @param {object}   props.sitePlan        - The site plan.
 * @param {string}   props.siteDomain      - The site domain.
 * @param {string}   props.siteUrl         - The site URL.
 * @param {boolean}  props.hasCustomDomain - Whether the site has a custom domain.
 *
 * @return {JSX.Element} The CelebrateLaunchModal component.
 */
export default function CelebrateLaunchModal( {
	onRequestClose,
	sitePlan,
	siteDomain: siteSlug,
	siteUrl,
	hasCustomDomain,
} ) {
	const isPaidPlan = !! sitePlan;
	const isBilledMonthly = sitePlan?.product_slug?.includes( 'monthly' );
	const [ clipboardCopied, setClipboardCopied ] = useState( false );

	useEffect( () => {
		wpcomTrackEvent( `calypso_launchpad_celebration_modal_view`, {
			product_slug: sitePlan?.product_slug,
		} );
	}, [ sitePlan?.product_slug ] );

	/**
	 * Render the upsell content.
	 *
	 * @return {JSX.Element} The upsell content.
	 */
	function renderUpsellContent() {
		let contentElement;
		let buttonText;
		let buttonHref;

		if ( ! isPaidPlan && ! hasCustomDomain ) {
			contentElement = (
				<p>
					{ createInterpolateElement(
						__(
							'Supercharge your website with a <strong>custom address</strong> that matches your blog, brand, or business.',
							'jetpack-mu-wpcom'
						),
						{
							strong: <strong />,
						}
					) }
				</p>
			);
			buttonText = __( 'Claim your domain', 'jetpack-mu-wpcom' );
			buttonHref = `https://wordpress.com/domains/add/${ siteSlug }`;
		} else if ( isPaidPlan && isBilledMonthly && ! hasCustomDomain ) {
			contentElement = (
				<p>
					{ __(
						'Interested in a custom domain? It’s free for the first year when you switch to annual billing.',
						'jetpack-mu-wpcom'
					) }
				</p>
			);
			buttonText = __( 'Claim your domain', 'jetpack-mu-wpcom' );
			buttonHref = `https://wordpress.com/domains/add/${ siteSlug }`;
		} else if ( isPaidPlan && ! hasCustomDomain ) {
			contentElement = (
				<p>
					{ createInterpolateElement(
						__(
							'Your paid plan includes a domain name <strong>free for one year</strong>. Choose one that’s easy to remember and even easier to share.',
							'jetpack-mu-wpcom'
						),
						{
							strong: <strong />,
						}
					) }
				</p>
			);
			buttonText = __( 'Claim your free domain', 'jetpack-mu-wpcom' );
			buttonHref = `https://wordpress.com/domains/add/${ siteSlug }`;
		} else if ( hasCustomDomain ) {
			return null;
		}

		return (
			<div className="launched__modal-upsell">
				<div className="launched__modal-upsell-content">{ contentElement }</div>
				<Button
					variant="primary"
					href={ buttonHref }
					onClick={ () =>
						wpcomTrackEvent( `calypso_launchpad_celebration_modal_upsell_clicked`, {
							product_slug: sitePlan?.product_slug,
						} )
					}
				>
					<span>{ buttonText }</span>
				</Button>
			</div>
		);
	}

	const ref = useCopyToClipboard( siteSlug, () => setClipboardCopied( true ) );

	return (
		<Modal onRequestClose={ onRequestClose } className="launched__modal">
			<ConfettiAnimation />
			<div className="launched__modal-content">
				<div className="launched__modal-text">
					<h1 className="launched__modal-heading">
						{ __( 'Congrats, your site is live!', 'jetpack-mu-wpcom' ) }
					</h1>
					<p className="launched__modal-body">
						{ __(
							'Now you can head over to your site and share it with the world.',
							'jetpack-mu-wpcom'
						) }
					</p>
				</div>
				<div className="launched__modal-actions">
					<div className="launched__modal-site">
						<div className="launched__modal-domain">
							<p className="launched__modal-domain-text">{ siteSlug }</p>
							<Tooltip
								text={ clipboardCopied ? __( 'Copied to clipboard!', 'jetpack-mu-wpcom' ) : '' }
								delay={ 0 }
								hideOnClick={ false }
							>
								<Button
									label={ __( 'Copy URL', 'jetpack-mu-wpcom' ) }
									className="launchpad__clipboard-button"
									borderless
									size="compact"
									ref={ ref }
									onMouseLeave={ () => setClipboardCopied( false ) }
								>
									<Icon icon={ copy } size={ 18 } />
								</Button>
							</Tooltip>
						</div>

						<Button href={ siteUrl } target="_blank" className="launched__modal-view-site">
							<Gridicon icon="domains" size={ 18 } />
							<span className="launched__modal-view-site-text">
								{ __( 'View site', 'jetpack-mu-wpcom' ) }
							</span>
						</Button>
					</div>
				</div>
			</div>
			{ renderUpsellContent() }
		</Modal>
	);
}
