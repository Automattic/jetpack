import { Gridicon, ConfettiAnimation } from '@automattic/components';
import { Button, Modal, Tooltip } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useState, useEffect } from '@wordpress/element';
import { Icon, copy } from '@wordpress/icons';
import { useTranslate } from 'i18n-calypso';
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
	const translate = useTranslate();
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
					{ translate(
						'Supercharge your website with a {{strong}}custom address{{/strong}} that matches your blog, brand, or business.',
						{ components: { strong: <strong /> } }
					) }
				</p>
			);
			buttonText = translate( 'Claim your domain' );
			buttonHref = `https://wordpress.com/domains/add/${ siteSlug }`;
		} else if ( isPaidPlan && isBilledMonthly && ! hasCustomDomain ) {
			contentElement = (
				<p>
					{ translate(
						'Interested in a custom domain? It’s free for the first year when you switch to annual billing.'
					) }
				</p>
			);
			buttonText = translate( 'Claim your domain' );
			buttonHref = `https://wordpress.com/domains/add/${ siteSlug }`;
		} else if ( isPaidPlan && ! hasCustomDomain ) {
			contentElement = (
				<p>
					{ translate(
						'Your paid plan includes a domain name {{strong}}free for one year{{/strong}}. Choose one that’s easy to remember and even easier to share.',
						{ components: { strong: <strong /> } }
					) }
				</p>
			);
			buttonText = translate( 'Claim your free domain' );
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
						{ translate( 'Congrats, your site is live!' ) }
					</h1>
					<p className="launched__modal-body">
						{ translate( 'Now you can head over to your site and share it with the world.' ) }
					</p>
				</div>
				<div className="launched__modal-actions">
					<div className="launched__modal-site">
						<div className="launched__modal-domain">
							<p className="launched__modal-domain-text">{ siteSlug }</p>
							<Tooltip
								text={ clipboardCopied ? translate( 'Copied to clipboard!' ) : '' }
								delay={ 0 }
								hideOnClick={ false }
							>
								<Button
									label={ translate( 'Copy URL' ) }
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
							<span className="launched__modal-view-site-text">{ translate( 'View site' ) }</span>
						</Button>
					</div>
				</div>
			</div>
			{ renderUpsellContent() }
		</Modal>
	);
}
