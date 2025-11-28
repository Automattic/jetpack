/**
 * External dependencies
 */
import restApi from '@automattic/jetpack-api';
import { Button, Notice, ExternalLink, Snackbar } from '@wordpress/components';
import { DataForm, type Field } from '@wordpress/dataviews';
import { createRoot, useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { Header } from './components/header';
import { ToggleWithEditorLink } from './components/toggle-with-link';
import './style.scss';

/**
 * Type definitions for newsletter settings data
 */
interface NewsletterSettings {
	subscriptions: boolean;
	stb_enabled: boolean;
	stc_enabled: boolean;
	sm_enabled: boolean;
	jetpack_subscribe_overlay_enabled: boolean;
	jetpack_subscribe_floating_button_enabled: boolean;
	jetpack_subscriptions_subscribe_post_end_enabled: boolean;
	jetpack_subscriptions_login_navigation_enabled: boolean;
	jetpack_subscriptions_subscribe_navigation_enabled: boolean;
	wpcom_featured_image_in_email: boolean;
	wpcom_subscription_emails_use_excerpt: boolean;
	jetpack_gravatar_in_email: boolean;
	jetpack_author_in_email: boolean;
	jetpack_post_date_in_email: boolean;
	jetpack_subscriptions_reply_to: 'comment' | 'author' | 'no-reply';
	jetpack_subscriptions_from_name: string;
	wpcom_newsletter_categories_enabled: boolean;
	wpcom_newsletter_categories: number[];
	subscription_options?: {
		welcome: string;
	};
	[ key: string ]: unknown;
}

/**
 * Type definitions for Jetpack Newsletter settings passed from PHP
 */
interface JetpackNewsletterSettings {
	isBlockTheme: boolean;
	siteAdminUrl: string;
	themeStylesheet: string;
	blogID: number;
	siteRawUrl: string;
	email: string;
	gravatar: string;
	displayName: string;
	wpAdminSubscriberManagementEnabled: boolean;
	isSubscriptionSiteEditSupported: boolean;
	setupPaymentPlansUrl: string;
	isSitePublic: boolean;
}

/**
 * Newsletter Settings App
 *
 * @return {JSX.Element | null} The newsletter settings component or null.
 */
function NewsletterSettingsApp(): JSX.Element | null {
	const [ data, setData ] = useState< NewsletterSettings | null >( null );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );

	// Subscription settings state (for manual save)
	const [ subscriptionChanges, setSubscriptionChanges ] = useState< Partial< NewsletterSettings > >(
		{}
	);
	const [ isSavingSubscriptions, setIsSavingSubscriptions ] = useState( false );

	// Sender name state (for manual save)
	const [ senderName, setSenderName ] = useState( '' );
	const [ isSavingSenderName, setIsSavingSenderName ] = useState( false );

	// Snackbar notification state
	const [ snackbarMessage, setSnackbarMessage ] = useState< string | null >( null );

	// Get settings from PHP
	const jetpackSettings = (
		window as Window & { jetpackNewsletterSettings?: JetpackNewsletterSettings }
	 ).jetpackNewsletterSettings;

	// Callback to clear error
	const clearError = useCallback( () => setError( null ), [] );

	// Callback to clear snackbar
	const clearSnackbar = useCallback( () => setSnackbarMessage( null ), [] );

	// Callback for sender name input change
	const handleSenderNameChange = useCallback(
		( e: React.ChangeEvent< HTMLInputElement > ) => setSenderName( e.target.value ),
		[]
	);

	// Load settings on mount
	useEffect( () => {
		// Initialize the REST API with WordPress settings
		const wpApiSettings = ( window as Window & { wpApiSettings?: { root: string; nonce: string } } )
			.wpApiSettings;
		if ( wpApiSettings ) {
			restApi.setApiRoot( wpApiSettings.root );
			restApi.setApiNonce( wpApiSettings.nonce );
		}

		restApi
			.fetchSettings()
			.then( ( settings: NewsletterSettings ) => {
				setData( settings );
				setSenderName( settings.jetpack_subscriptions_from_name || '' );
				setIsLoading( false );
			} )
			.catch( ( err: Error ) => {
				setError( err.message || 'Failed to load settings' );
				setIsLoading( false );
			} );
	}, [] );

	// Handle auto-save for newsletter toggle and email settings
	const handleAutoSave = useCallback(
		( updates: Partial< NewsletterSettings > ) => {
			if ( ! data ) {
				return;
			}

			// Update local state optimistically
			setData( { ...data, ...updates } );

			// Save to backend
			restApi.updateSettings( updates ).catch( ( err: Error ) => {
				setError( err.message || 'Failed to save settings' );
				// Revert optimistic update on error
				setData( data );
			} );
		},
		[ data ]
	);

	// Handle subscription settings changes (staged, not auto-saved)
	const handleSubscriptionChange = useCallback(
		( updates: Partial< NewsletterSettings > ) => {
			if ( ! data ) {
				return;
			}

			// Update local state
			setData( { ...data, ...updates } );

			// Track changes for save button
			setSubscriptionChanges( { ...subscriptionChanges, ...updates } );
		},
		[ data, subscriptionChanges ]
	);

	// Save subscription settings
	const saveSubscriptionSettings = useCallback( () => {
		setIsSavingSubscriptions( true );
		setError( null );

		restApi
			.updateSettings( subscriptionChanges )
			.then( () => {
				setSubscriptionChanges( {} );
				setSnackbarMessage( __( 'Settings saved', 'jetpack-newsletter' ) );
			} )
			.catch( ( err: Error ) => {
				setError( err.message || 'Failed to save subscription settings' );
			} )
			.finally( () => {
				setIsSavingSubscriptions( false );
			} );
	}, [ subscriptionChanges ] );

	// Save sender name
	const saveSenderName = useCallback( () => {
		setIsSavingSenderName( true );
		setError( null );

		restApi
			.updateSettings( { jetpack_subscriptions_from_name: senderName } )
			.then( () => {
				if ( data ) {
					setData( { ...data, jetpack_subscriptions_from_name: senderName } );
				}
				setSnackbarMessage( __( 'Sender name saved', 'jetpack-newsletter' ) );
			} )
			.catch( ( err: Error ) => {
				setError( err.message || 'Failed to save sender name' );
			} )
			.finally( () => {
				setIsSavingSenderName( false );
			} );
	}, [ senderName, data ] );

	// Helper to check if we can show editor links for block theme features
	const canShowBlockThemeEditorLinks =
		jetpackSettings?.isBlockTheme &&
		jetpackSettings?.siteAdminUrl &&
		jetpackSettings?.themeStylesheet;

	// Helper to check if we can show editor links for subscription site edit features
	const canShowSubscriptionEditorLinks =
		jetpackSettings?.isSubscriptionSiteEditSupported &&
		jetpackSettings?.siteAdminUrl &&
		jetpackSettings?.themeStylesheet;

	// Define form fields
	const fields = [
		{
			id: 'subscriptions',
			label: __(
				'Let visitors subscribe to this site and receive emails when you publish a post',
				'jetpack-newsletter'
			),
			type: 'boolean' as const,
			Edit: 'toggle' as const,
		},
		{
			id: 'jetpack_subscriptions_subscribe_post_end_enabled',
			label: __( 'Subscribe block at post end', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: canShowSubscriptionEditorLinks
				? ( {
						data: formData,
						field,
						onChange,
				  }: {
						data: NewsletterSettings;
						field: Field< Record< string, unknown > >;
						onChange: ( updates: Partial< NewsletterSettings > ) => void;
				  } ) => (
						<ToggleWithEditorLink
							data={ formData }
							field={ field }
							onChange={ onChange }
							siteAdminUrl={ jetpackSettings.siteAdminUrl }
							themeStylesheet={ jetpackSettings.themeStylesheet }
							postType="wp_template"
							templateId="single"
						/>
				  )
				: ( 'toggle' as const ),
		},
		{
			id: 'sm_enabled',
			label: __( 'Subscription pop-up when scrolling', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: canShowBlockThemeEditorLinks
				? ( {
						data: formData,
						field,
						onChange,
				  }: {
						data: NewsletterSettings;
						field: Field< Record< string, unknown > >;
						onChange: ( updates: Partial< NewsletterSettings > ) => void;
				  } ) => (
						<ToggleWithEditorLink
							data={ formData }
							field={ field }
							onChange={ onChange }
							siteAdminUrl={ jetpackSettings.siteAdminUrl }
							themeStylesheet={ jetpackSettings.themeStylesheet }
							postType="wp_template_part"
							templateId="jetpack-subscribe-modal"
						/>
				  )
				: ( 'toggle' as const ),
		},
		{
			id: 'jetpack_subscribe_overlay_enabled',
			label: __( 'Subscription overlay on homepage', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: canShowBlockThemeEditorLinks
				? ( {
						data: formData,
						field,
						onChange,
				  }: {
						data: NewsletterSettings;
						field: Field< Record< string, unknown > >;
						onChange: ( updates: Partial< NewsletterSettings > ) => void;
				  } ) => (
						<ToggleWithEditorLink
							data={ formData }
							field={ field }
							onChange={ onChange }
							siteAdminUrl={ jetpackSettings.siteAdminUrl }
							themeStylesheet={ jetpackSettings.themeStylesheet }
							postType="wp_template_part"
							templateId="jetpack-subscribe-overlay"
						/>
				  )
				: ( 'toggle' as const ),
		},
		{
			id: 'jetpack_subscribe_floating_button_enabled',
			label: __( 'Floating subscribe button', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: canShowBlockThemeEditorLinks
				? ( {
						data: formData,
						field,
						onChange,
				  }: {
						data: NewsletterSettings;
						field: Field< Record< string, unknown > >;
						onChange: ( updates: Partial< NewsletterSettings > ) => void;
				  } ) => (
						<ToggleWithEditorLink
							data={ formData }
							field={ field }
							onChange={ onChange }
							siteAdminUrl={ jetpackSettings.siteAdminUrl }
							themeStylesheet={ jetpackSettings.themeStylesheet }
							postType="wp_template_part"
							templateId="jetpack-subscribe-floating-button"
						/>
				  )
				: ( 'toggle' as const ),
		},
		{
			id: 'jetpack_subscriptions_subscribe_navigation_enabled',
			label: __( 'Subscribe block in navigation', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: canShowSubscriptionEditorLinks
				? ( {
						data: formData,
						field,
						onChange,
				  }: {
						data: NewsletterSettings;
						field: Field< Record< string, unknown > >;
						onChange: ( updates: Partial< NewsletterSettings > ) => void;
				  } ) => (
						<ToggleWithEditorLink
							data={ formData }
							field={ field }
							onChange={ onChange }
							siteAdminUrl={ jetpackSettings.siteAdminUrl }
							themeStylesheet={ jetpackSettings.themeStylesheet }
							postType="wp_template"
							templateId="index"
						/>
				  )
				: ( 'toggle' as const ),
		},
		{
			id: 'jetpack_subscriptions_login_navigation_enabled',
			label: __( 'Subscriber login block in navigation', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: canShowSubscriptionEditorLinks
				? ( {
						data: formData,
						field,
						onChange,
				  }: {
						data: NewsletterSettings;
						field: Field< Record< string, unknown > >;
						onChange: ( updates: Partial< NewsletterSettings > ) => void;
				  } ) => (
						<ToggleWithEditorLink
							data={ formData }
							field={ field }
							onChange={ onChange }
							siteAdminUrl={ jetpackSettings.siteAdminUrl }
							themeStylesheet={ jetpackSettings.themeStylesheet }
							postType="wp_template"
							templateId="index"
						/>
				  )
				: ( 'toggle' as const ),
		},
		{
			id: 'stb_enabled',
			label: __( '"Subscribe to site" on comment form', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: 'toggle' as const,
		},
		{
			id: 'stc_enabled',
			label: __( '"Subscribe to comments" on comment form', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: 'toggle' as const,
		},
		{
			id: 'wpcom_featured_image_in_email',
			label: __( 'Featured image in emails', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: 'toggle' as const,
			description: __(
				"Includes your post's featured image in the email sent out to your readers.",
				'jetpack-newsletter'
			),
		},
		{
			id: 'wpcom_subscription_emails_use_excerpt',
			label: __( 'Email content', 'jetpack-newsletter' ),
			type: 'integer' as const,
			Edit: 'radio' as const,
			elements: [
				{
					value: 0,
					label: __( 'Full text', 'jetpack-newsletter' ),
				},
				{
					value: 1,
					label: __( 'Excerpt', 'jetpack-newsletter' ),
				},
			],
			description: __(
				'Sets whether email subscribers can read full posts in emails or just an excerpt and link to the full version.',
				'jetpack-newsletter'
			),
		},
		{
			id: 'jetpack_gravatar_in_email',
			label: __( 'Show author avatar', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: 'toggle' as const,
			description: __(
				'We use Gravatar, a service that associates an avatar image with your primary email address.',
				'jetpack-newsletter'
			),
		},
		{
			id: 'jetpack_author_in_email',
			label: __( 'Show author display name', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: 'toggle' as const,
		},
		{
			id: 'jetpack_post_date_in_email',
			label: __( 'Add post date', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: 'toggle' as const,
			description: __(
				"You can customize the date format in your site's general settings.",
				'jetpack-newsletter'
			),
		},
		{
			id: 'jetpack_subscriptions_reply_to',
			label: __( 'Reply-to settings', 'jetpack-newsletter' ),
			type: 'text' as const,
			Edit: 'radio' as const,
			elements: [
				{
					value: 'comment',
					label: __( 'Replies will be a public comment on the post', 'jetpack-newsletter' ),
				},
				{
					value: 'author',
					label: __( "Replies will be sent to the post author's email", 'jetpack-newsletter' ),
				},
				{ value: 'no-reply', label: __( 'Replies are not allowed', 'jetpack-newsletter' ) },
			],
			description: __(
				"Sets the reply to email address for your newsletter emails. It's the email where subscribers send their replies.",
				'jetpack-newsletter'
			),
		},
		{
			id: 'wpcom_newsletter_categories_enabled',
			label: __( 'Enable newsletter categories', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: 'toggle' as const,
			description: __(
				"Newsletter categories let you select the content that's emailed to subscribers. When enabled, only posts in the selected categories will be sent as newsletters.",
				'jetpack-newsletter'
			),
		},
	];

	if ( isLoading ) {
		return (
			<div className="newsletter-settings">
				<p>{ __( 'Loading newsletter settings…', 'jetpack-newsletter' ) }</p>
			</div>
		);
	}

	if ( error ) {
		return (
			<div className="newsletter-settings newsletter-settings--error">
				<Notice status="error" isDismissible={ false }>
					{ error }
				</Notice>
			</div>
		);
	}

	if ( ! data ) {
		return null;
	}

	const hasSubscriptionChanges = Object.keys( subscriptionChanges ).length > 0;
	const hasSenderNameChanged = senderName !== ( data.jetpack_subscriptions_from_name || '' );

	// Helper function to get "Manage all subscribers" URL
	const getManageSubscribersUrl = () => {
		if ( ! jetpackSettings ) {
			return '#';
		}

		if ( jetpackSettings.wpAdminSubscriberManagementEnabled ) {
			return `${ jetpackSettings.siteAdminUrl }admin.php?page=subscribers`;
		}

		// Fallback to WordPress.com URL
		const site = jetpackSettings.blogID || jetpackSettings.siteRawUrl;
		return `https://wordpress.com/subscribers/${ site }`;
	};

	return (
		<div className="newsletter-settings">
			<Header />

			{ error && (
				<Notice status="error" isDismissible onRemove={ clearError }>
					{ error }
				</Notice>
			) }

			{ /* Newsletter Section */ }
			<div className="newsletter-settings__section">
				<h3 className="newsletter-settings__section-title">
					{ __( 'Newsletter', 'jetpack-newsletter' ) }
				</h3>
				<div className="newsletter-settings__section-content">
					<DataForm
						data={ data }
						fields={ fields.filter( f => f.id === 'subscriptions' ) }
						form={ {
							layout: {
								type: 'regular',
								labelPosition: 'top',
							},
							fields: [ 'subscriptions' ],
						} }
						onChange={ handleAutoSave }
					/>
					{ data.subscriptions && (
						<div className="newsletter-settings__link">
							<ExternalLink href={ getManageSubscribersUrl() }>
								{ __( 'Manage all subscribers', 'jetpack-newsletter' ) }
							</ExternalLink>
						</div>
					) }
				</div>
			</div>

			{ /* Subscriptions Section */ }
			<div className="newsletter-settings__section">
				<h3 className="newsletter-settings__section-title">
					{ __( 'Subscriptions', 'jetpack-newsletter' ) }
				</h3>
				<p className="newsletter-settings__section-description">
					{ __(
						'Automatically add subscription forms to your site and turn visitors into subscribers.',
						'jetpack-newsletter'
					) }
				</p>
				<div className="newsletter-settings__section-content">
					<DataForm
						data={ data }
						fields={ fields.filter( f =>
							[
								'jetpack_subscriptions_subscribe_post_end_enabled',
								'sm_enabled',
								'jetpack_subscribe_overlay_enabled',
								'jetpack_subscribe_floating_button_enabled',
								'jetpack_subscriptions_subscribe_navigation_enabled',
								'jetpack_subscriptions_login_navigation_enabled',
								'stb_enabled',
								'stc_enabled',
							].includes( f.id )
						) }
						form={ {
							layout: {
								type: 'regular',
								labelPosition: 'top',
							},
							fields: [
								{
									id: 'homepage_and_posts',
									label: __( 'Homepage and posts', 'jetpack-newsletter' ),
									children: [
										'jetpack_subscriptions_subscribe_post_end_enabled',
										'sm_enabled',
										'jetpack_subscribe_overlay_enabled',
										'jetpack_subscribe_floating_button_enabled',
									],
								},
								{
									id: 'navigation',
									label: __( 'Navigation', 'jetpack-newsletter' ),
									children: [
										'jetpack_subscriptions_subscribe_navigation_enabled',
										'jetpack_subscriptions_login_navigation_enabled',
									],
								},
								{
									id: 'comments',
									label: __( 'Comments', 'jetpack-newsletter' ),
									children: [ 'stb_enabled', 'stc_enabled' ],
								},
							],
						} }
						onChange={ handleSubscriptionChange }
					/>

					<div className="newsletter-settings__section-actions">
						<Button
							variant="primary"
							onClick={ saveSubscriptionSettings }
							disabled={ isSavingSubscriptions || ! hasSubscriptionChanges }
							isBusy={ isSavingSubscriptions }
						>
							{ isSavingSubscriptions
								? __( 'Saving…', 'jetpack-newsletter' )
								: __( 'Save', 'jetpack-newsletter' ) }
						</Button>
					</div>
				</div>
			</div>

			{ /* Paid Newsletter Section */ }
			{ jetpackSettings?.setupPaymentPlansUrl && (
				<div className="newsletter-settings__section">
					<h3 className="newsletter-settings__section-title">
						{ __( 'Paid Newsletter', 'jetpack-newsletter' ) }
					</h3>
					<div className="newsletter-settings__section-content">
						<p>
							{ __(
								'Earn money through your Newsletter. Reward your most loyal subscribers with exclusive content or add a paywall to monetize content.',
								'jetpack-newsletter'
							) }
						</p>
						<Button
							variant="primary"
							href={ jetpackSettings.setupPaymentPlansUrl }
							target="_blank"
							rel="noopener noreferrer"
						>
							{ __( 'Add Plans', 'jetpack-newsletter' ) }
						</Button>
					</div>
				</div>
			) }

			{ /* Email Configuration Section */ }
			<div className="newsletter-settings__section">
				<h3 className="newsletter-settings__section-title">
					{ __( 'Email configuration', 'jetpack-newsletter' ) }
				</h3>
				<div className="newsletter-settings__section-content">
					<DataForm
						data={ data }
						fields={ fields.filter( f =>
							[
								'wpcom_featured_image_in_email',
								'wpcom_subscription_emails_use_excerpt',
								'jetpack_gravatar_in_email',
								'jetpack_author_in_email',
								'jetpack_post_date_in_email',
								'jetpack_subscriptions_reply_to',
							].includes( f.id )
						) }
						form={ {
							layout: {
								type: 'regular',
								labelPosition: 'top',
							},
							fields: [
								'wpcom_featured_image_in_email',
								{
									id: 'email_content_settings',
									label: __( 'For each new post email, include', 'jetpack-newsletter' ),
									children: [ 'wpcom_subscription_emails_use_excerpt' ],
								},
								{
									id: 'email_byline',
									label: __( 'Email byline', 'jetpack-newsletter' ),
									children: [
										'jetpack_gravatar_in_email',
										'jetpack_author_in_email',
										'jetpack_post_date_in_email',
									],
								},
								{
									id: 'reply_to_settings',
									children: [ 'jetpack_subscriptions_reply_to' ],
								},
							],
						} }
						onChange={ handleAutoSave }
					/>

					{ /* Featured image learn more link */ }
					<div className="newsletter-settings__help-text">
						<ExternalLink href="https://wordpress.com/support/featured-images/">
							{ __( 'Learn more about featured images', 'jetpack-newsletter' ) }
						</ExternalLink>
					</div>

					{ /* Gravatar link */ }
					{ data.jetpack_gravatar_in_email && jetpackSettings?.email && (
						<div className="newsletter-settings__link">
							<ExternalLink href={ `https://gravatar.com/${ jetpackSettings.email }` }>
								{ __( 'Update my Gravatar', 'jetpack-newsletter' ) }
							</ExternalLink>
						</div>
					) }

					{ /* Reply-to learn more link */ }
					<div className="newsletter-settings__help-text">
						<ExternalLink href="https://wordpress.com/support/subscriptions-and-newsletters/">
							{ __( 'Learn more about subscriptions and newsletters', 'jetpack-newsletter' ) }
						</ExternalLink>
					</div>

					{ /* Sender name field with inline save */ }
					<div className="newsletter-settings__sender-name">
						<label htmlFor="sender-name-input" className="newsletter-settings__field-label">
							{ __( 'Sender name', 'jetpack-newsletter' ) }
						</label>
						<div className="newsletter-settings__sender-name-controls">
							<input
								id="sender-name-input"
								type="text"
								className="newsletter-settings__text-input"
								value={ senderName }
								onChange={ handleSenderNameChange }
							/>
							{ hasSenderNameChanged && (
								<Button
									variant="primary"
									onClick={ saveSenderName }
									disabled={ isSavingSenderName }
									isBusy={ isSavingSenderName }
								>
									{ isSavingSenderName
										? __( 'Saving…', 'jetpack-newsletter' )
										: __( 'Save', 'jetpack-newsletter' ) }
								</Button>
							) }
						</div>
						<p className="newsletter-settings__field-description">
							{ __( 'Preview:', 'jetpack-newsletter' ) }{ ' ' }
							<strong>
								{ senderName ||
									jetpackSettings?.displayName ||
									__( 'Your Name', 'jetpack-newsletter' ) }
							</strong>{ ' ' }
							&lt;comment-reply@wordpress.com&gt;
						</p>
						<p className="newsletter-settings__field-description">
							{ __(
								"This is the name that appears in subscribers' inboxes. It's usually the name of your newsletter or the author.",
								'jetpack-newsletter'
							) }
						</p>
					</div>
				</div>
			</div>

			{ /* Newsletter Categories Section */ }
			<div className="newsletter-settings__section">
				<h3 className="newsletter-settings__section-title">
					{ __( 'Newsletter categories', 'jetpack-newsletter' ) }
				</h3>
				<p className="newsletter-settings__section-description">
					{ __(
						"Newsletter categories let you select the content that's emailed to subscribers. When enabled, only posts in the selected categories will be sent as newsletters.",
						'jetpack-newsletter'
					) }
				</p>
				<div className="newsletter-settings__section-content">
					<DataForm
						data={ data }
						fields={ fields.filter( f => f.id === 'wpcom_newsletter_categories_enabled' ) }
						form={ {
							layout: {
								type: 'regular',
								labelPosition: 'top',
							},
							fields: [ 'wpcom_newsletter_categories_enabled' ],
						} }
						onChange={ handleAutoSave }
					/>
				</div>
			</div>

			{ /* Snackbar for success notifications */ }
			{ snackbarMessage && <Snackbar onRemove={ clearSnackbar }>{ snackbarMessage }</Snackbar> }
		</div>
	);
}

// Initialize the app when DOM is ready
const container = document.getElementById( 'newsletter-settings-root' );
if ( container ) {
	const root = createRoot( container );
	root.render( <NewsletterSettingsApp /> );
}
