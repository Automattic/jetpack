/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import {
	getAdminUrl,
	getSiteData,
	getSiteType,
	isWpcomPlatformSite,
} from '@automattic/jetpack-script-data';
import { WpcomSupportLink } from '@automattic/jetpack-shared-extension-utils/components/wpcom-support-link';
import { DataForm, type Field, useFormValidity } from '@wordpress/dataviews';
import { createInterpolateElement, useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card, Fieldset, Link, Notice, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { fetchCategories } from '../api';
import type { NewsletterSettings, WordPressCategory } from '../types';

interface NewsletterCategoriesSectionProps {
	data: NewsletterSettings;
	onChange: ( updates: Partial< NewsletterSettings > ) => void;
	onSave: () => void;
	isSaving: boolean;
	hasChanges: boolean;
	/** Setting keys staged in this section's changeset, fed into section_save analytics. */
	changedKeys?: string[];
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
	changedKeys,
	isNewsletterEnabled,
}: NewsletterCategoriesSectionProps ): JSX.Element {
	const siteType = getSiteType();
	const [ categories, setCategories ] = useState< WordPressCategory[] >( [] );
	const [ isFetchingCategories, setIsFetchingCategories ] = useState( true );
	const [ categoriesError, setCategoriesError ] = useState< string | null >( null );

	// Track section save with the keys that changed since the last save.
	const handleSave = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_section_save', {
			site_type: siteType,
			section: 'newsletter_categories',
			changed_keys: ( changedKeys ?? [] ).join( ',' ),
			change_count: ( changedKeys ?? [] ).length,
		} );
		onSave();
	}, [ changedKeys, onSave, siteType ] );

	// Fetch WordPress categories on mount
	useEffect( () => {
		fetchCategories()
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
	}, [] );

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
			label: __( 'Newsletter categories', 'jetpack-newsletter' ),
			description: __(
				'Which categories will you use for newsletter subscribers? Select all that apply.',
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
	const isWpcom = isWpcomPlatformSite();
	const subscribeBlockUrl = isWpcom
		? 'https://wordpress.com/support/wordpress-editor/blocks/subscribe-block/'
		: `https://jetpack.com/redirect/?source=jetpack-support-subscribe-block&site=${
				getSiteData()?.wpcom?.blog_id || ''
		  }`;

	const SubscribeBlockLink = isWpcom ? (
		<WpcomSupportLink supportLink={ subscribeBlockUrl } supportPostId={ 170164 } />
	) : (
		<Link openInNewTab href={ subscribeBlockUrl } children={ null } />
	);

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Newsletter categories', 'jetpack-newsletter' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<p>
					<Text>
						{ createInterpolateElement(
							__(
								"Newsletter categories let you select the content that's emailed to subscribers. When enabled, only posts in the selected categories will be sent as newsletters. By default, subscribers can choose from your selected categories, or you can pre-select categories using the <link>subscribe block</link>. When you add a new category, your existing subscribers will be automatically subscribed to it.",
								'jetpack-newsletter'
							),
							{
								link: SubscribeBlockLink,
							}
						) }
					</Text>
				</p>
				{ categoriesError && (
					<Notice.Root intent="error">
						<Notice.Description>{ categoriesError }</Notice.Description>
					</Notice.Root>
				) }
				<Fieldset.Root disabled={ ! isNewsletterEnabled || !! categoriesError }>
					<DataForm
						data={ data }
						fields={ newsletterCategoriesFields }
						form={ newsletterCategoriesForm }
						onChange={ onChange }
						validity={ validity }
					/>

					{ data.wpcom_newsletter_categories_enabled && (
						<p>
							<Link
								openInNewTab
								href={ getAdminUrl(
									'edit-tags.php?taxonomy=category&referer=newsletter-categories'
								) }
							>
								{ __( 'Add new category', 'jetpack-newsletter' ) }
							</Link>
						</p>
					) }
				</Fieldset.Root>
				<div className="newsletter-card-footer">
					<Button
						onClick={ handleSave }
						disabled={
							! isNewsletterEnabled ||
							isSaving ||
							! hasChanges ||
							isFetchingCategories ||
							( data.wpcom_newsletter_categories_enabled && ! isValid )
						}
						loading={ isSaving }
						loadingAnnouncement={ savingText }
					>
						{ saveText }
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	);
}
