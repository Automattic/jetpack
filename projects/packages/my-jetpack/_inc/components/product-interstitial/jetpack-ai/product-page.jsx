/**
 * External dependencies
 */
import {
	AdminPage,
	Col,
	Container,
	JetpackLogo,
	AiIcon,
	getRedirectUrl,
	Notice,
} from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { Button, Card, ExternalLink } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, plus, help, check } from '@wordpress/icons';
import clsx from 'clsx';
import debugFactory from 'debug';
import { useCallback, useState, useEffect } from 'react';
/**
 * Internal dependencies
 */
import useProduct from '../../../data/products/use-product';
import useAnalytics from '../../../hooks/use-analytics';
import { useGoBack } from '../../../hooks/use-go-back';
import useMyJetpackNavigate from '../../../hooks/use-my-jetpack-navigate';
import GoBackLink from '../../go-back-link';
import styles from './style.module.scss';

const debug = debugFactory( 'my-jetpack:product-interstitial:jetpack-ai-product-page' );

/**
 * Product Page for Jetpack AI
 * @returns {object} React component for the product page
 */
export default function () {
	const { onClickGoBack } = useGoBack( 'jetpack-ai' );
	const { detail } = useProduct( 'jetpack-ai' );
	const { description, aiAssistantFeature } = detail;
	const [ showNotice, setShowNotice ] = useState( false );
	const { isRegistered } = useConnection();

	const videoTitleContentGeneration = __(
		'Generate and edit content faster with Jetpack AI Assistant',
		'jetpack-my-jetpack'
	);
	const videoTitleFeaturedImages = __(
		'Create featured images with one click',
		'jetpack-my-jetpack'
	);
	const videoTitleForms = __( 'Build forms using prompts', 'jetpack-my-jetpack' );
	const videoTitleContentFeedback = __( 'Get feedback on posts', 'jetpack-my-jetpack' );

	debug( aiAssistantFeature );
	const {
		requestsCount: allTimeRequests = 0,
		currentTier,
		nextTier,
		usagePeriod: usage,
		isOverLimit,
	} = aiAssistantFeature || {};

	const hasUnlimited = currentTier?.value === 1;
	const isFree = currentTier?.value === 0;
	const hasPaidTier = ! isFree && ! hasUnlimited;
	const shouldContactUs = ! hasUnlimited && hasPaidTier && ! nextTier && currentTier;
	const freeRequestsLeft = isFree && 20 - allTimeRequests >= 0 ? 20 - allTimeRequests : 0;
	const showCurrentUsage = hasPaidTier && ! isFree && usage;
	const showAllTimeUsage = hasPaidTier || hasUnlimited;
	const contactHref = getRedirectUrl( 'jetpack-ai-tiers-more-requests-contact' );
	const feedbackURL = getRedirectUrl( 'jetpack-ai-feedback' );
	const videoLinkFeaturedImages = getRedirectUrl( 'jetpack-ai-product-page-featured-image-link' );
	const videoLinkForms = getRedirectUrl( 'jetpack-ai-product-page-form-link' );
	const videoLinkContentFeedback = getRedirectUrl(
		'jetpack-ai-product-page-content-feedback-link'
	);

	// isRegistered works as a flag to know if the page can link to a post creation or not
	const ctaURL = isRegistered
		? 'post-new.php?use_ai_block=1&_wpnonce=' + window?.jetpackAi?.nonce
		: '#/connection';
	const newPostCta = __( 'Create new post', 'jetpack-my-jetpack' );
	const installCta = __(
		'Connect to Jetpack to start using the AI Assistant',
		'jetpack-my-jetpack'
	);

	const showRenewalNotice = isOverLimit && hasPaidTier;
	const showUpgradeNotice = isOverLimit && isFree;

	const currentTierValue = currentTier?.value || 0;
	const currentUsage = usage?.[ 'requests-count' ] || 0;
	const tierRequestsLeft =
		currentTierValue - currentUsage >= 0 ? currentTierValue - currentUsage : 0;

	const renewalNoticeTitle = __(
		"You've reached your request limit for this month",
		'jetpack-my-jetpack'
	);
	const upgradeNoticeTitle = __( "You've used all your free requests", 'jetpack-my-jetpack' );

	const renewalNoticeBody = sprintf(
		// translators: %d is the number of days left in the month.
		__(
			'Wait for %d days to reset your limit, or upgrade now to a higher tier for additional requests and keep your work moving forward.',
			'jetpack-my-jetpack'
		),
		Math.floor( ( new Date( usage?.[ 'next-start' ] ) - new Date() ) / ( 1000 * 60 * 60 * 24 ) )
	);
	const upgradeNoticeBody = __(
		'Reach for More with Jetpack AI! Upgrade now for additional requests and keep your momentum going.',
		'jetpack-my-jetpack'
	);
	const renewalNoticeCta = sprintf(
		// translators: %s is the next upgrade value
		__( 'Get %s requests', 'jetpack-my-jetpack' ),
		nextTier?.value || 'more'
	);
	const upgradeNoticeCta = __( 'Upgrade now', 'jetpack-my-jetpack' );

	const navigateToPricingTable = useMyJetpackNavigate( '/add-jetpack-ai' );
	const { recordEvent } = useAnalytics();

	const contactClickHandler = useCallback( () => {
		recordEvent( 'jetpack_ai_upgrade_contact_us', { placement: 'product-page' } );
	}, [ recordEvent ] );

	const upgradeClickHandler = useCallback( () => {
		recordEvent( 'jetpack_ai_upgrade_button', {
			placement: 'product-page',
			context: 'my-jetpack',
			current_tier_slug: currentTier?.slug || '',
			requests_count: allTimeRequests,
		} );
		navigateToPricingTable();
	}, [ recordEvent, allTimeRequests, currentTier, navigateToPricingTable ] );

	const onNoticeClose = useCallback( () => setShowNotice( false ), [] );

	useEffect( () => {
		recordEvent( 'jetpack_ai_myjetpack_product_page_view', {
			current_tier_slug: currentTier?.slug || '',
			requests_count: allTimeRequests,
		} );
	}, [ allTimeRequests, currentTier?.slug, recordEvent ] );

	useEffect( () => {
		setShowNotice( showRenewalNotice || showUpgradeNotice );
	}, [ showRenewalNotice, showUpgradeNotice ] );

	const newBadge = (
		<span className={ styles[ 'product-interstitial__new-badge' ] }>
			{ __( 'New', 'jetpack-my-jetpack' ) }{ ' ' }
		</span>
	);

	return (
		<AdminPage showHeader={ false } showBackground={ true }>
			<Container fluid horizontalSpacing={ 3 } horizontalGap={ 2 }>
				<Col className={ clsx( styles[ 'product-interstitial__section' ] ) }>
					<div className={ styles[ 'product-interstitial__section-wrapper-wide' ] }>
						<GoBackLink onClick={ onClickGoBack } />
					</div>
					<div
						className={ clsx(
							styles[ 'product-interstitial__section-wrapper-wide' ],
							styles[ 'product-interstitial__product-header' ]
						) }
					>
						<JetpackLogo />
						<div className={ styles[ 'product-interstitial__product-header-name' ] }>
							{ __( 'AI Assistant', 'jetpack-my-jetpack' ) }
						</div>
					</div>
				</Col>
				<Col className={ clsx( styles[ 'product-interstitial__section' ] ) }>
					<div className={ styles[ 'product-interstitial__hero-section' ] }>
						<div className={ styles[ 'product-interstitial__hero-content' ] }>
							<h1 className={ styles[ 'product-interstitial__hero-heading' ] }>{ description }</h1>
							<div className={ styles[ 'product-interstitial__hero-sub-heading' ] }>
								{ __(
									'Draft, transform, translate, and alter both new and existing content leveraging the capabilities of AI, inside the block editor.',
									'jetpack-my-jetpack'
								) }
							</div>
							{ ! shouldContactUs && ! hasUnlimited && (
								<Button
									variant="primary"
									onClick={ upgradeClickHandler }
									className={ styles[ 'product-interstitial__hero-cta' ] }
								>
									{ __( 'Get more requests', 'jetpack-my-jetpack' ) }
								</Button>
							) }
							{ shouldContactUs && (
								<Button
									variant="primary"
									onClick={ contactClickHandler }
									href={ contactHref }
									className={ styles[ 'product-interstitial__hero-cta' ] }
								>
									{ __( 'Contact Us', 'jetpack-my-jetpack' ) }
								</Button>
							) }
						</div>
						<div className={ styles[ 'product-interstitial__hero-side' ] }>
							{ showCurrentUsage && (
								<Card className={ styles[ 'stats-card' ] }>
									<AiIcon />
									<div>
										<div className={ styles[ 'product-interstitial__stats-card-text' ] }>
											{ __( 'Requests for this month', 'jetpack-my-jetpack' ) }
										</div>
										<div className={ styles[ 'product-interstitial__stats-card-value' ] }>
											{ tierRequestsLeft }
										</div>
									</div>
								</Card>
							) }
							{ showAllTimeUsage && (
								<Card className={ styles[ 'stats-card' ] }>
									<Icon icon={ check } className={ styles[ 'stats-card-icon-check' ] } />
									<div>
										<div className={ styles[ 'product-interstitial__stats-card-text' ] }>
											{ __( 'All-time requests used', 'jetpack-my-jetpack' ) }
										</div>
										<div className={ styles[ 'product-interstitial__stats-card-value' ] }>
											{ allTimeRequests }
										</div>
									</div>
								</Card>
							) }
							{ isFree && (
								<Card className={ styles[ 'stats-card' ] }>
									<Icon icon={ check } className={ styles[ 'stats-card-icon-check' ] } />
									<div>
										<div className={ styles[ 'product-interstitial__stats-card-text' ] }>
											{ __( 'Free requests available', 'jetpack-my-jetpack' ) }
										</div>
										<div className={ styles[ 'product-interstitial__stats-card-value' ] }>
											{ freeRequestsLeft }
										</div>
									</div>
								</Card>
							) }
						</div>
					</div>
				</Col>
				<Col className={ styles[ 'product-interstitial__section' ] }>
					<div className={ styles[ 'product-interstitial__section-wrapper' ] }>
						{ showNotice && (
							<div className={ styles[ 'product-interstitial__ai-notice' ] }>
								<Notice
									actions={ [
										<Button isPrimary onClick={ upgradeClickHandler }>
											{ showRenewalNotice ? renewalNoticeCta : upgradeNoticeCta }
										</Button>,
									] }
									onClose={ onNoticeClose }
									level={ showRenewalNotice ? 'warning' : 'error' }
									title={ showRenewalNotice ? renewalNoticeTitle : upgradeNoticeTitle }
								>
									{ showRenewalNotice ? renewalNoticeBody : upgradeNoticeBody }
								</Notice>
							</div>
						) }
						<h2 className={ styles[ 'product-interstitial__section-heading' ] }>
							{ __( 'AI Features', 'jetpack-my-jetpack' ) }
						</h2>
						<p className={ styles[ 'product-interstitial__section-sub-heading' ] }>
							{ __( 'Discover all the Jetpack features powered by AI', 'jetpack-my-jetpack' ) }
						</p>
						<div className={ styles[ 'product-interstitial__usage-videos' ] }>
							<div className={ styles[ 'product-interstitial__usage-videos-item' ] }>
								<div className={ styles[ 'product-interstitial__usage-videos-video' ] }>
									<iframe
										width="280"
										height="157"
										src="https://videopress.com/embed/GdXmtVtW?posterUrl=https%3A%2F%2Fjetpackme.files.wordpress.com%2F2024%2F02%2Fimage-37.png%3Fw%3D560"
										allowFullScreen
										allow="clipboard-write"
										title={ videoTitleContentGeneration }
									></iframe>
									<script src="https://videopress.com/videopress-iframe.js"></script>
								</div>
								<div className={ styles[ 'product-interstitial__usage-videos-content' ] }>
									<div className={ styles[ 'product-interstitial__usage-videos-heading' ] }>
										{ videoTitleContentGeneration }
									</div>
									<div className={ styles[ 'product-interstitial__usage-videos-text' ] }>
										{ __(
											'Use the AI block to generate content, or use our AI edit options in existing blocks. Use prompts or any of our recommended actions.',
											'jetpack-my-jetpack'
										) }
									</div>
									<Button
										className={ styles[ 'product-interstitial__usage-videos-link' ] }
										icon={ plus }
										href={ ctaURL }
									>
										{ isRegistered ? newPostCta : installCta }
									</Button>
								</div>
							</div>

							<div className={ styles[ 'product-interstitial__usage-videos-item' ] }>
								<div className={ styles[ 'product-interstitial__usage-videos-video' ] }>
									<iframe
										width="280"
										height="157"
										src="https://videopress.com/embed/HJCf8cXc?posterUrl=https%3A%2F%2Fjetpackme.files.wordpress.com%2F2024%2F02%2Fone-click-featured-images.png%3Fw%3D560"
										allowFullScreen
										allow="clipboard-write"
										title={ videoTitleFeaturedImages }
									></iframe>
									<script src="https://videopress.com/videopress-iframe.js"></script>
								</div>
								<div className={ styles[ 'product-interstitial__usage-videos-content' ] }>
									<div className={ styles[ 'product-interstitial__usage-videos-heading' ] }>
										{ videoTitleFeaturedImages }
										{ newBadge }
									</div>
									<div className={ styles[ 'product-interstitial__usage-videos-text' ] }>
										{ __(
											'Create featured images to illustrate your content and make it more engaging with just one click. Use prompts to generate adjusted new featured images.',
											'jetpack-my-jetpack'
										) }
									</div>
									<Button
										className={ styles[ 'product-interstitial__usage-videos-link' ] }
										icon={ help }
										target="_blank"
										href={ videoLinkFeaturedImages }
									>
										{ __( 'Learn about featured images', 'jetpack-my-jetpack' ) }
									</Button>
								</div>
							</div>

							<div className={ styles[ 'product-interstitial__usage-videos-item' ] }>
								<div className={ styles[ 'product-interstitial__usage-videos-video' ] }>
									<iframe
										width="280"
										height="157"
										src="https://videopress.com/embed/OMI3zqid?posterUrl=https%3A%2F%2Fjetpackme.files.wordpress.com%2F2024%2F02%2Fimage-38.png%3Fw%3D560"
										allowFullScreen
										allow="clipboard-write"
										title={ videoTitleForms }
									></iframe>
									<script src="https://videopress.com/videopress-iframe.js"></script>
								</div>
								<div className={ styles[ 'product-interstitial__usage-videos-content' ] }>
									<div className={ styles[ 'product-interstitial__usage-videos-heading' ] }>
										{ videoTitleForms }
									</div>
									<div className={ styles[ 'product-interstitial__usage-videos-text' ] }>
										{ __(
											'Quickly build forms using the Jetpack Forms block and AI. Use prompts to describe your form and AI will generate the elements in a few seconds.',
											'jetpack-my-jetpack'
										) }
									</div>
									<Button
										className={ styles[ 'product-interstitial__usage-videos-link' ] }
										icon={ help }
										target="_blank"
										href={ videoLinkForms }
									>
										{ __( 'Learn about forms', 'jetpack-my-jetpack' ) }
									</Button>
								</div>
							</div>

							<div className={ styles[ 'product-interstitial__usage-videos-item' ] }>
								<div className={ styles[ 'product-interstitial__usage-videos-video' ] }>
									<iframe
										width="280"
										height="157"
										src="https://videopress.com/embed/0vb0OJm7?posterUrl=https%3A%2F%2Fjetpackme.files.wordpress.com%2F2024%2F02%2Fimage-39.png%3Fw%3D560"
										allowFullScreen
										allow="clipboard-write"
										title={ videoTitleContentFeedback }
									></iframe>
									<script src="https://videopress.com/videopress-iframe.js"></script>
								</div>
								<div className={ styles[ 'product-interstitial__usage-videos-content' ] }>
									<div className={ styles[ 'product-interstitial__usage-videos-heading' ] }>
										{ videoTitleContentFeedback }
									</div>
									<div className={ styles[ 'product-interstitial__usage-videos-text' ] }>
										{ __(
											'Get instant feedback on your post before publishing. AI will read your post and highlight opportunities to improve your publication.',
											'jetpack-my-jetpack'
										) }
									</div>
									<Button
										className={ styles[ 'product-interstitial__usage-videos-link' ] }
										icon={ help }
										target="_blank"
										href={ videoLinkContentFeedback }
									>
										{ __( 'Learn more', 'jetpack-my-jetpack' ) }
									</Button>
								</div>
							</div>
						</div>
					</div>
				</Col>
				<Col className={ styles[ 'product-interstitial__section' ] }>
					<div className={ styles[ 'product-interstitial__section-wrapper' ] }>
						<div className={ styles[ 'product-interstitial__section-emoji' ] }>👋</div>
						<h2 className={ styles[ 'product-interstitial__section-heading' ] }>
							{ __( 'Do you have any feedback?', 'jetpack-my-jetpack' ) }
						</h2>
						<p className={ styles[ 'product-interstitial__section-sub-heading' ] }>
							{ __(
								'Help us improving the accuracy of our results and feel free to give us ideas for future implementations and improvements.',
								'jetpack-my-jetpack'
							) }{ ' ' }
							<ExternalLink href={ feedbackURL }>
								{ __( 'Share your feedback!', 'jetpack-my-jetpack' ) }
							</ExternalLink>
						</p>
					</div>
				</Col>
			</Container>
		</AdminPage>
	);
}
