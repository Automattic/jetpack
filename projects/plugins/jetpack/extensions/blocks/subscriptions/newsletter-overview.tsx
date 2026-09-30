import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	Button,
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { dispatch, useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import {
	accessOptions,
	META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS,
} from '../../shared/memberships/constants';
import { getNewsletterOverviewText } from '../../shared/memberships/newsletter-copy';
import { useSetSendEmail } from '../../shared/memberships/settings';
import SubscribersAffirmation, {
	getCurrentTierName,
} from '../../shared/memberships/subscribers-affirmation';
import { store as membershipProductsStore } from '../../store/membership-products';
import paywallBlockMetadata from '../paywall/block.json';

// PluginSidebar identifier: the `jetpack-subscriptions` plugin's `jetpack-newsletter-settings-sidebar`.
const NEWSLETTER_SIDEBAR_IDENTIFIER = 'jetpack-subscriptions/jetpack-newsletter-settings-sidebar';
const EMPTY_ARRAY = []; // A constant to avoid creating a new array on every render.

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
	const isPrivate = useSelect(
		select => select( editorStore ).getEditedPostVisibility() === 'private',
		[]
	);
	// A private post isn't emailed, so there is no audience to name.
	const label =
		accessLevel && ! isPrivate ? accessOptions[ accessLevel as AccessLevelKey ]?.label : null;

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
		categoriesEnabled,
		newsletterCategories,
		postCategories,
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

			return {
				isPublished: isCurrentPostPublished(),
				isAlreadySent: postId ? getPostEmailSentState( postId )?.email_sent_at != null : false,
				isEmailEnabled: ! meta?.[ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ],
				postVisibility: getEditedPostVisibility(),
				hasPaywall: select( blockEditorStore )
					.getBlocks()
					.some( block => block.name === paywallBlockMetadata.name ),
				tierName: getCurrentTierName( accessLevel, meta, getNewsletterTierProducts() ),
				// Store references only: a new array here would fail useSelect's equality check
				// and re-render on every editor change, so derived lists are built below.
				categoriesEnabled: getNewsletterCategoriesEnabled(),
				newsletterCategories: ( getNewsletterCategories() ?? EMPTY_ARRAY ) as NewsletterCategory[],
				postCategories: ( getEditedPostAttribute( 'categories' ) ?? EMPTY_ARRAY ) as number[],
			};
		},
		[ accessLevel ]
	);

	const categoryNames = categoriesEnabled
		? newsletterCategories
				.filter( category => postCategories.includes( category.id ) )
				.map( category => category.name )
		: EMPTY_ARRAY;

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

	const settingsLink = (
		<Button
			variant="link"
			onClick={ openNewsletterSidebar }
			className="jetpack-newsletter-overview__settings-link"
		>
			{ __( 'Change newsletter settings', 'jetpack' ) }
		</Button>
	);

	// Checked before the published branch: a saved private post also counts as published.
	if ( postVisibility === 'private' ) {
		return (
			<div className="jetpack-newsletter-overview">
				<Notice.Root intent="warning" icon={ null }>
					<Notice.Title>{ __( 'This post is private', 'jetpack' ) }</Notice.Title>
					<Notice.Description>
						{ __(
							'To send this post to subscribers, change its visibility to Public or Password protected.',
							'jetpack'
						) }
					</Notice.Description>
				</Notice.Root>
				<p className="jetpack-newsletter-overview__main">
					{ __( 'This post won’t be emailed.', 'jetpack' ) }
				</p>
				<p className="jetpack-newsletter-overview__details">
					{ __(
						'Private posts are only visible to admins and editors, so they can’t be emailed.',
						'jetpack'
					) }
				</p>
				{ settingsLink }
			</div>
		);
	}

	// Once the post is out (or its email already went), report what happened instead.
	if ( isPublished || isAlreadySent ) {
		return (
			<div className="jetpack-newsletter-overview">
				<SubscribersAffirmation accessLevel={ accessLevel } prePublish={ prePublish } />
				{ settingsLink }
			</div>
		);
	}

	const newsletterOverview = getNewsletterOverviewText( {
		accessLevel,
		isEmailEnabled,
		isPasswordProtected: postVisibility === 'password',
		hasPaywall,
		tierName,
		categoryNames,
	} );

	return (
		<div className="jetpack-newsletter-overview">
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
					{ settingsLink }
				</>
			) }
		</div>
	);
}
