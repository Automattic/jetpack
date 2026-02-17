/**
 * External dependencies
 */
import { WpcomSupportLink } from '@automattic/jetpack-shared-extension-utils/components';
import { Button, ExternalLink, Notice } from '@wordpress/components';
import { DataForm, type Field, useFormValidity } from '@wordpress/dataviews/wp';
import { createInterpolateElement, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { fetchCategories } from '../api';
import type { NewsletterSettings, JetpackNewsletterSettings, WordPressCategory } from '../types';

interface NewsletterCategoriesSectionProps {
	data: NewsletterSettings;
	onChange: ( updates: Partial< NewsletterSettings > ) => void;
	onSave: () => void;
	isSaving: boolean;
	hasChanges: boolean;
	jetpackSettings: JetpackNewsletterSettings | undefined;
	isNewsletterEnabled: boolean;
}

/**
 * Newsletter Categories Section Component
 *
 * @param {NewsletterCategoriesSectionProps} props - Component props
 * @return {JSX.Element} The newsletter categories section
 */
export function NewsletterCategoriesSection( {
	data,
	onChange,
	onSave,
	isSaving,
	hasChanges,
	jetpackSettings,
	isNewsletterEnabled,
}: NewsletterCategoriesSectionProps ): JSX.Element {
	const [ categories, setCategories ] = useState< WordPressCategory[] >( [] );
	const [ isFetchingCategories, setIsFetchingCategories ] = useState( true );
	const [ categoriesError, setCategoriesError ] = useState< string | null >( null );

	// Fetch WordPress categories on mount
	useEffect( () => {
		fetchCategories( jetpackSettings )
			.then( fetchedCategories => {
				// Convert category IDs to strings
				setCategories(
					fetchedCategories.map( cat => ( {
						id: String( cat.id ),
						name: cat.name,
					} ) )
				);
				setIsFetchingCategories( false );
			} )
			.catch( ( err: Error ) => {
				setCategoriesError(
					err.message || __( 'Failed to load categories', 'jetpack-newsletter' )
				);
				setIsFetchingCategories( false );
			} );
	}, [ jetpackSettings ] );

	// Define fields
	const fields: Field< NewsletterSettings >[] = [
		{
			id: 'wpcom_newsletter_categories_enabled',
			label: __( 'Enable newsletter categories', 'jetpack-newsletter' ),
			type: 'boolean' as const,
			Edit: 'toggle' as const,
		},
		{
			id: 'wpcom_newsletter_categories',
			label: __(
				'Which categories will you use for newsletter subscribers? Select all that apply:',
				'jetpack-newsletter'
			),
			type: 'array' as const,
			elements: categories.map( cat => ( {
				value: cat.id,
				label: cat.name,
			} ) ),
			isValid: {
				elements: true,
				custom: ( item: NewsletterSettings ) => {
					if (
						item.wpcom_newsletter_categories_enabled &&
						! item.wpcom_newsletter_categories?.length
					) {
						return __(
							'Please select at least one category when newsletter categories are enabled.',
							'jetpack-newsletter'
						);
					}
					return null;
				},
			},
		},
	];

	// Field list for newsletter categories section
	const newsletterCategoriesFieldIds = data.wpcom_newsletter_categories_enabled
		? [ 'wpcom_newsletter_categories_enabled', 'wpcom_newsletter_categories' ]
		: [ 'wpcom_newsletter_categories_enabled' ];

	const newsletterCategoriesFields = fields.filter( f =>
		newsletterCategoriesFieldIds.includes( f.id )
	);

	// Form configuration for newsletter categories
	const newsletterCategoriesForm = {
		layout: {
			type: 'regular' as const,
			labelPosition: 'top' as const,
		},
		fields: newsletterCategoriesFieldIds,
	};

	// Get form validity state for newsletter categories
	const { validity = {}, isValid = true } =
		useFormValidity( data, newsletterCategoriesFields, newsletterCategoriesForm ) || {};

	// Translation strings for save button
	const savingText = __( 'Saving…', 'jetpack-newsletter' );
	const saveText = __( 'Save', 'jetpack-newsletter' );

	// Build subscribe block documentation URL and component
	const subscribeBlockUrl = jetpackSettings?.isWpcomPlatform
		? 'https://wordpress.com/support/wordpress-editor/blocks/subscribe-block/'
		: `https://jetpack.com/redirect/?source=jetpack-support-subscribe-block&site=${
				jetpackSettings?.blogID || ''
		  }`;

	const SubscribeBlockLink = jetpackSettings?.isWpcomPlatform ? (
		<WpcomSupportLink supportLink={ subscribeBlockUrl } supportPostId={ 170164 } />
	) : (
		<ExternalLink href={ subscribeBlockUrl } children={ null } />
	);

	return (
		<div className="newsletter-settings__section">
			<h3 className="newsletter-settings__section-title">
				{ __( 'Newsletter categories', 'jetpack-newsletter' ) }
			</h3>
			<p className="newsletter-settings__section-description">
				{ createInterpolateElement(
					__(
						"Newsletter categories let you select the content that's emailed to subscribers. When enabled, only posts in the selected categories will be sent as newsletters. By default, subscribers can choose from your selected categories, or you can pre-select categories using the <link>subscribe block</link>. When you add a new category, your existing subscribers will be automatically subscribed to it.",
						'jetpack-newsletter'
					),
					{
						link: SubscribeBlockLink,
					}
				) }
			</p>
			{ categoriesError && (
				<Notice status="error" isDismissible={ false }>
					{ categoriesError }
				</Notice>
			) }
			<fieldset
				className="newsletter-settings__section-content"
				disabled={ ! isNewsletterEnabled || !! categoriesError }
			>
				<DataForm
					data={ data }
					fields={ newsletterCategoriesFields }
					form={ newsletterCategoriesForm }
					onChange={ onChange }
					validity={ validity }
				/>

				{ data.wpcom_newsletter_categories_enabled && jetpackSettings?.siteAdminUrl && (
					<div className="newsletter-settings__link">
						<ExternalLink
							href={ `${ jetpackSettings.siteAdminUrl }edit-tags.php?taxonomy=category&referer=newsletter-categories` }
						>
							{ __( 'Add New Category', 'jetpack-newsletter' ) }
						</ExternalLink>
					</div>
				) }

				<div className="newsletter-settings__section-actions">
					<Button
						variant="primary"
						onClick={ onSave }
						disabled={
							! isNewsletterEnabled ||
							isSaving ||
							! hasChanges ||
							isFetchingCategories ||
							( data.wpcom_newsletter_categories_enabled && ! isValid )
						}
						isBusy={ isSaving }
					>
						{ isSaving ? savingText : saveText }
					</Button>
				</div>
			</fieldset>
		</div>
	);
}
