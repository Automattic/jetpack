import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	Button,
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { dispatch, useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __, sprintf } from '@wordpress/i18n';
import {
	accessOptions,
	META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS,
} from '../../shared/memberships/constants';
import { useSetSendEmail } from '../../shared/memberships/settings';
import SubscribersAffirmation, {
	getCurrentTierName,
} from '../../shared/memberships/subscribers-affirmation';
import {
	getShowMisconfigurationWarning,
	MisconfigurationWarning,
} from '../../shared/memberships/utils';
import { store as membershipProductsStore } from '../../store/membership-products';
import paywallBlockMetadata from '../paywall/block.json';

// PluginSidebar identifier: the `jetpack-subscriptions` plugin's `jetpack-newsletter-settings-sidebar`.
const NEWSLETTER_SIDEBAR_IDENTIFIER = 'jetpack-subscriptions/jetpack-newsletter-settings-sidebar';

type AccessLevelKey = keyof typeof accessOptions;

interface NewsletterCategory {
	id: number;
	name: string;
}

/**
 * Panel title: "Newsletter", followed by the audience when one is known.
 *
 * @param {object} props             - Component props.
 * @param {string} props.accessLevel - Access level key, e.g. 'subscribers'.
 * @return {JSX.Element} The title.
 */
export function NewsletterOverviewTitle( { accessLevel }: { accessLevel?: string } ): JSX.Element {
	const label = accessLevel ? accessOptions[ accessLevel as AccessLevelKey ]?.label : null;

	if ( ! label ) {
		return <>{ __( 'Newsletter', 'jetpack' ) }</>;
	}

	return (
		<>
			{ __( 'Newsletter:', 'jetpack' ) }
			<span className="jetpack-newsletter-overview__title-audience">{ label }</span>
		</>
	);
}

interface NewsletterOverviewProps {
	accessLevel?: string;
	prePublish?: boolean;
	openPreviewModal: () => void;
	openTestEmailModal: () => void;
}

/**
 * Summary of who gets the post by email, with shortcuts to preview, test, and the Newsletter sidebar.
 *
 * @param {NewsletterOverviewProps} props - Component props.
 * @return {JSX.Element} The overview.
 */
export default function NewsletterOverview( {
	accessLevel,
	prePublish = false,
	openPreviewModal,
	openTestEmailModal,
}: NewsletterOverviewProps ): JSX.Element {
	const setSendEmail = useSetSendEmail();
	const { closePublishSidebar } = useDispatch( editorStore );

	const {
		isPublished,
		isAlreadySent,
		isEmailEnabled,
		postVisibility,
		hasPaywall,
		tierName,
		categoryNames,
	} = useSelect(
		select => {
			const {
				getCurrentPostId,
				getEditedPostAttribute,
				getEditedPostVisibility,
				isCurrentPostPublished,
			} = select( editorStore );
			const {
				getNewsletterCategories,
				getNewsletterCategoriesEnabled,
				getNewsletterTierProducts,
				getPostEmailSentState,
			} = select( membershipProductsStore );

			const postId = getCurrentPostId();
			const meta = getEditedPostAttribute( 'meta' );
			const postCategories: number[] = getEditedPostAttribute( 'categories' ) ?? [];
			const newsletterCategories: NewsletterCategory[] = getNewsletterCategories() ?? [];

			return {
				isPublished: isCurrentPostPublished(),
				isAlreadySent: postId ? getPostEmailSentState( postId )?.email_sent_at != null : false,
				isEmailEnabled: ! meta?.[ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ],
				postVisibility: getEditedPostVisibility(),
				hasPaywall: select( blockEditorStore )
					.getBlocks()
					.some( block => block.name === paywallBlockMetadata.name ),
				tierName: getCurrentTierName( accessLevel, meta, getNewsletterTierProducts() ),
				categoryNames: getNewsletterCategoriesEnabled()
					? newsletterCategories
							.filter( category => postCategories.includes( category.id ) )
							.map( category => category.name )
					: [],
			};
		},
		[ accessLevel ]
	);

	// Once the post is out (or its email already went), report what happened instead.
	if ( isPublished || isAlreadySent ) {
		return <SubscribersAffirmation accessLevel={ accessLevel } prePublish={ prePublish } />;
	}

	const newsletterOverview = getNewsletterOverviewText( {
		accessLevel,
		isEmailEnabled,
		isPasswordProtected: postVisibility === 'password',
		hasPaywall,
		tierName,
		categoryNames,
	} );

	const openNewsletterSidebar = () => {
		if ( prePublish ) {
			closePublishSidebar();
		}
		// Addressed by name: importing the edit-post store would register it in editors without it.
		(
			dispatch( 'core/edit-post' ) as unknown as
				{ openGeneralSidebar?: ( sidebar: string ) => void } | undefined
		 )?.openGeneralSidebar?.( NEWSLETTER_SIDEBAR_IDENTIFIER );
	};

	return (
		<div className="jetpack-newsletter-overview">
			{ getShowMisconfigurationWarning( postVisibility, accessLevel ) && (
				<MisconfigurationWarning />
			) }
			<p className="jetpack-newsletter-overview__main">{ newsletterOverview.main }</p>
			{ !! newsletterOverview.categoryNames?.length && (
				<ul className="jetpack-newsletter-overview__categories">
					{ newsletterOverview.categoryNames.map( name => (
						<li key={ name }>{ name }</li>
					) ) }
				</ul>
			) }
			{ newsletterOverview.details.map( detail => (
				<p key={ detail } className="jetpack-newsletter-overview__details">
					{ detail }
				</p>
			) ) }
			{ newsletterOverview.isEmailOff ? (
				<Button
					variant="primary"
					onClick={ () => setSendEmail( true ) }
					className="jetpack-newsletter-overview__full-width"
					__next40pxDefaultSize
				>
					{ __( 'Turn on email sending', 'jetpack' ) }
				</Button>
			) : (
				<>
					<VStack spacing={ 3 }>
						<Button
							variant="secondary"
							onClick={ openPreviewModal }
							className="jetpack-newsletter-overview__full-width"
							__next40pxDefaultSize
						>
							{ __( 'Preview email', 'jetpack' ) }
						</Button>
						<Button
							variant="secondary"
							onClick={ openTestEmailModal }
							className="jetpack-newsletter-overview__full-width"
							__next40pxDefaultSize
						>
							{ __( 'Send test email', 'jetpack' ) }
						</Button>
					</VStack>
					<Button
						variant="link"
						onClick={ openNewsletterSidebar }
						className="jetpack-newsletter-overview__settings-link"
					>
						{ __( 'Change newsletter settings', 'jetpack' ) }
					</Button>
				</>
			) }
		</div>
	);
}

interface OverviewText {
	main: string;
	details: string[];
	categoryNames?: string[];
	isEmailOff?: boolean;
}

interface OverviewTextArgs {
	accessLevel?: string;
	isEmailEnabled: boolean;
	isPasswordProtected: boolean;
	hasPaywall: boolean;
	tierName: string | null;
	categoryNames: string[];
}

const getAccessLevelKey = ( accessLevel?: string ): AccessLevelKey =>
	accessLevel && accessLevel in accessOptions ? ( accessLevel as AccessLevelKey ) : 'everybody';

/**
 * Describe who receives the post by email and who can read it on the site.
 *
 * @param {OverviewTextArgs} args - Post settings that decide the newsletterOverview.
 * @return {OverviewText} The copy to render.
 */
function getNewsletterOverviewText( args: OverviewTextArgs ): OverviewText {
	const level = getAccessLevelKey( args.accessLevel );

	if ( ! args.isEmailEnabled ) {
		const readers = {
			everybody: __(
				'Anyone can read it on your site, even if they’ve never subscribed.',
				'jetpack'
			),
			subscribers: __( 'Only subscribers can read it on your site.', 'jetpack' ),
			paid_subscribers: __( 'Only paid subscribers can read it on your site.', 'jetpack' ),
		};
		return {
			main: __( 'This post won’t be emailed.', 'jetpack' ),
			details: [ readers[ level ] ],
			isEmailOff: true,
		};
	}

	const text = getEmailedAudienceText( args );

	// Password protection changes what the email contains, not who receives it.
	if ( args.isPasswordProtected ) {
		return {
			...text,
			details: [
				__(
					'The post stays password protected on your site. Only people with the password can read it there.',
					'jetpack'
				),
			],
		};
	}

	return text;
}

/**
 * Describe who receives the post by email, for a post that will be emailed.
 *
 * @param {OverviewTextArgs} args - Post settings that decide the text.
 * @return {OverviewText} The text to render.
 */
function getEmailedAudienceText( {
	accessLevel,
	hasPaywall,
	tierName,
	categoryNames,
}: OverviewTextArgs ): OverviewText {
	const level = getAccessLevelKey( accessLevel );
	// A paywall sends the part above it to every subscriber, even on a paid post.
	const isPaid = level === 'paid_subscribers' && ! hasPaywall;
	const audience = isPaid ? 'paid' : 'all';

	const freeCanUpgrade = __(
		'Your free subscribers are not emailed. They can upgrade on your site to read it.',
		'jetpack'
	);

	if ( categoryNames.length ) {
		const toCategories = {
			all: __(
				'This post is emailed to subscribers who chose these newsletter categories.',
				'jetpack'
			),
			paid: __(
				'This post is emailed to paid subscribers who chose these newsletter categories.',
				'jetpack'
			),
		};
		const plusAllContent = {
			all: __( 'Plus subscribers who chose ‘All content’.', 'jetpack' ),
			paid: __( 'Plus paid subscribers who chose ‘All content’.', 'jetpack' ),
		};

		return {
			main:
				isPaid && tierName
					? sprintf(
							/* translators: %s: paid newsletter tier name, e.g. "VIP". */
							__(
								'This post is emailed to ‘%s’ subscribers who chose these newsletter categories.',
								'jetpack'
							),
							tierName
						)
					: toCategories[ audience ],
			categoryNames,
			details: isPaid ? [ plusAllContent.paid, freeCanUpgrade ] : [ plusAllContent.all ],
		};
	}

	if ( isPaid && tierName ) {
		return {
			main: sprintf(
				/* translators: %s: paid newsletter tier name, e.g. "Plus". */
				__( 'Only your ‘%s’ subscribers are emailed this post.', 'jetpack' ),
				tierName
			),
			details: [ freeCanUpgrade ],
		};
	}

	if ( hasPaywall && level !== 'everybody' ) {
		return {
			main: __(
				'This post is emailed to all subscribers. The email stops at your paywall.',
				'jetpack'
			),
			details: [ __( 'Your free subscribers can upgrade on your site to read it.', 'jetpack' ) ],
		};
	}

	const emailedTo = {
		everybody: __( 'This post is emailed to all subscribers.', 'jetpack' ),
		subscribers: __( 'This post is emailed to all subscribers.', 'jetpack' ),
		paid_subscribers: __( 'Only your paid subscribers are emailed this post.', 'jetpack' ),
	};
	const readers = {
		everybody: __( 'Anyone can read it on your site.', 'jetpack' ),
		subscribers: __( 'Site visitors have to subscribe to read it.', 'jetpack' ),
		paid_subscribers: freeCanUpgrade,
	};
	return { main: emailedTo[ level ], details: [ readers[ level ] ] };
}
