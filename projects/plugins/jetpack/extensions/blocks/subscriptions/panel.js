import { getRedirectUrl } from '@automattic/jetpack-components';
import {
	getSiteFragment,
	isComingSoon,
	isPrivateSite,
	useAnalytics,
} from '@automattic/jetpack-shared-extension-utils';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils/components';
import { Button, Notice, PanelRow } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
	PluginPrePublishPanel,
	PluginDocumentSettingPanel,
	PluginPostPublishPanel,
} from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { external, Icon } from '@wordpress/icons';
import { accessOptions } from '../../shared/memberships/constants';
import { useAccessLevel, isNewsletterFeatureEnabled } from '../../shared/memberships/edit';
import {
	NewsletterAccessDocumentSettings,
	NewsletterEmailDocumentSettings,
} from '../../shared/memberships/settings';
import SubscribersAffirmation from '../../shared/memberships/subscribers-affirmation';
import {
	getShowMisconfigurationWarning,
	MisconfigurationWarning,
} from '../../shared/memberships/utils';
import { store as membershipProductsStore } from '../../store/membership-products';
import { NewsletterTestEmailModal } from './email-preview';

import './panel.scss';

function NewsletterEditorSettingsPanel( { accessLevel } ) {
	return (
		<PluginDocumentSettingPanel
			className="jetpack-subscribe-newsletter-panel"
			title={ __( 'Access', 'jetpack' ) }
			icon={ <JetpackEditorPanelLogo /> }
			name="jetpack-subscribe-newsletters-editor-panel"
		>
			<NewsletterAccessDocumentSettings accessLevel={ accessLevel } />
		</PluginDocumentSettingPanel>
	);
}

const NewsletterDisabledNotice = () => (
	<Notice status="info" isDismissible={ false } className="edit-post-post-visibility__notice">
		{ __( 'You will be able to send newsletters once the site is published', 'jetpack' ) }
	</Notice>
);

const NewsletterDisabledPanels = () => (
	<>
		<PluginDocumentSettingPanel
			className="jetpack-subscribe-newsletters-panel"
			title={ __( 'Access', 'jetpack' ) }
			icon={ <JetpackEditorPanelLogo /> }
		>
			<NewsletterDisabledNotice />
		</PluginDocumentSettingPanel>
		<PluginPrePublishPanel
			className="jetpack-subscribe-newsletters-panel"
			title={ __( 'Newsletter', 'jetpack' ) }
			icon={ <JetpackEditorPanelLogo /> }
		>
			<NewsletterDisabledNotice />
		</PluginPrePublishPanel>
		<PluginPostPublishPanel
			className="jetpack-subscribe-newsletters-panel"
			title={ __( 'Newsletter', 'jetpack' ) }
			icon={ <JetpackEditorPanelLogo /> }
		>
			<NewsletterDisabledNotice />
		</PluginPostPublishPanel>
	</>
);

function NewsletterPrePublishSettingsPanel( { accessLevel, showPreviewModal } ) {
	const postVisibility = useSelect( select => select( editorStore ).getEditedPostVisibility() );
	const showMisconfigurationWarning = getShowMisconfigurationWarning( postVisibility, accessLevel );

	return (
		<>
			<PluginPrePublishPanel
				initialOpen
				name="jetpack-subscribe-access-panel"
				className="jetpack-subscribe-newsletters-panel"
				title={
					<>
						{ __( 'Access:', 'jetpack' ) }
						{ accessLevel && (
							<span className={ 'jetpack-subscribe-post-publish-panel__heading' }>
								{ accessOptions[ accessLevel ].panelHeading }
							</span>
						) }
					</>
				}
				icon={ <JetpackEditorPanelLogo /> }
			>
				<NewsletterAccessDocumentSettings accessLevel={ accessLevel } />
			</PluginPrePublishPanel>
			<PluginPrePublishPanel
				initialOpen
				name="jetpack-subscribe-newsletters-panel"
				title={ __( 'Newsletter', 'jetpack' ) }
				icon={ <JetpackEditorPanelLogo /> }
			>
				<NewsletterEmailDocumentSettings />
				{ showMisconfigurationWarning ? (
					<MisconfigurationWarning />
				) : (
					<SubscribersAffirmation prePublish={ true } accessLevel={ accessLevel } />
				) }
				<Button variant="link" onClick={ showPreviewModal }>
					{ __( 'Send test email', 'jetpack' ) }
				</Button>
			</PluginPrePublishPanel>
		</>
	);
}

function NewsletterPostPublishSettingsPanel( { accessLevel } ) {
	const { isStripeConnected } = useSelect( select => {
		const { getConnectUrl } = select( membershipProductsStore );
		return {
			isStripeConnected: null === getConnectUrl(),
		};
	} );

	return (
		<>
			<PluginPostPublishPanel
				title={ __( 'Newsletter', 'jetpack' ) }
				className="jetpack-subscribe-newsletters-panel jetpack-subscribe-post-publish-panel"
				icon={ <JetpackEditorPanelLogo /> }
				name="jetpack-subscribe-newsletters-postpublish-panel"
			>
				<SubscribersAffirmation accessLevel={ accessLevel } />
			</PluginPostPublishPanel>

			{ ! isStripeConnected && (
				<PluginPostPublishPanel
					className="jetpack-subscribe-newsletters-panel paid-newsletters-post-publish-panel"
					title={ __( 'Set up a paid newsletter', 'jetpack' ) }
					icon={ <JetpackEditorPanelLogo /> }
				>
					<PanelRow>
						<p>
							{ __(
								'Allow your subscribers to support your work. Connect a Stripe account to get started.',
								'jetpack'
							) }
						</p>
					</PanelRow>
					<div role="link" className="post-publish-panel__postpublish-buttons">
						<Button
							target="_blank"
							variant="secondary"
							href={ getRedirectUrl( 'wpcom-earn', {
								site: getSiteFragment(),
							} ) }
						>
							{ __( 'Turn on paid newsletters', 'jetpack' ) }
							<Icon
								icon={ external }
								className="paid-newsletters-post-publish-panel__external_icon"
							/>
						</Button>
					</div>
				</PluginPostPublishPanel>
			) }
		</>
	);
}

export default function SubscribePanels() {
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const { tracks } = useAnalytics();
	const accessLevel = useAccessLevel( postType );

	// Subscriptions are only available for posts. Additionally, we will allow access level selector for pages.
	// TODO: Make it available for pages later.
	if ( postType !== 'post' ) {
		return null;
	}

	// Only show the panels when the corresponding filter is enabled
	if ( ! isNewsletterFeatureEnabled() ) {
		return null;
	}

	// Subscriptions will not be triggered on private sites ( on WordPress.com simple and WoA ),
	// nor on sites that have not been launched yet.
	if ( isPrivateSite() || isComingSoon() ) {
		return <NewsletterDisabledPanels />;
	}

	return (
		<>
			<NewsletterEditorSettingsPanel accessLevel={ accessLevel } />
			<NewsletterPrePublishSettingsPanel
				accessLevel={ accessLevel }
				showPreviewModal={ () => {
					tracks.recordEvent( 'jetpack_send_email_preview_prepublish_preview_button' );
					setIsModalOpen( true );
				} }
			/>
			<NewsletterPostPublishSettingsPanel accessLevel={ accessLevel } />
			<NewsletterTestEmailModal isOpen={ isModalOpen } onClose={ () => setIsModalOpen( false ) } />
		</>
	);
}
