/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getSiteData, getSiteType, isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { WpcomSupportLink } from '@automattic/jetpack-shared-extension-utils/components/wpcom-support-link';
import { DataForm, type Field, useFormValidity } from '@wordpress/dataviews';
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card, Fieldset, Link, Notice, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { fetchCategories } from '../api';
import {
	CreatableCategoriesControl,
	CreatableCategoryContext,
} from './creatable-categories-control';
import type { NewsletterSettings, WordPressCategory } from '../types';
import type { CreatableCategoryContextValue } from './creatable-categories-control';

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
	// Error surfaced by the combined create/search control when a creation fails.
	const [ createCategoryError, setCreateCategoryError ] = useState< string | null >( null );

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

	// Append a freshly created category to the list so it renders as a token
	// without a page refresh (deduped in case it already slipped in).
	const appendCategory = useCallback( ( category: WordPressCategory ) => {
		setCategories( prev =>
			prev.some( cat => cat.id === category.id ) ? prev : [ ...prev, category ]
		);
	}, [] );

	// Fired by the control when a category is successfully created.
	const handleCategoryCreated = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_category_created', {
			site_type: siteType,
		} );
	}, [ siteType ] );

	// Stable wiring handed to the combined control via context.
	const creatableContext = useMemo< CreatableCategoryContextValue >(
		() => ( {
			appendCategory,
			onError: setCreateCategoryError,
			onCreated: handleCategoryCreated,
		} ),
		[ appendCategory, handleCategoryCreated ]
	);

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
				'Search to add existing categories, or create a new one.',
				'jetpack-newsletter'
			),
			type: 'array' as const,
			// Custom control: one field that both searches existing categories and
			// creates new ones (via a "Create ‘…’" suggestion row), replacing the
			// separate "Add new category" link.
			Edit: CreatableCategoriesControl as unknown as Field< NewsletterSettings >[ 'Edit' ],
			elements: categories.map( cat => ( {
				value: cat.id,
				label: cat.name,
			} ) ),
			isValid: {
				// No `elements: true` — the custom control creates categories and
				// appends them to `elements` before selecting, so a selected value is
				// never out of range. Only the "select at least one" rule applies.
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

	// Build subscribe block documentation URL and component. Deep-link to the
	// "Subscribe to specific categories" section, since that's what this copy is
	// about (the redirect service appends the fragment via its `anchor` param).
	const isWpcom = isWpcomPlatformSite();
	const subscribeBlockUrl = isWpcom
		? 'https://wordpress.com/support/wordpress-editor/blocks/subscribe-block/#subscribe-to-specific-categories'
		: `https://jetpack.com/redirect/?source=jetpack-support-subscribe-block&anchor=subscribe-to-specific-categories&site=${
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
					<CreatableCategoryContext.Provider value={ creatableContext }>
						<DataForm
							data={ data }
							fields={ newsletterCategoriesFields }
							form={ newsletterCategoriesForm }
							onChange={ onChange }
							validity={ validity }
						/>
					</CreatableCategoryContext.Provider>

					{ data.wpcom_newsletter_categories_enabled && createCategoryError && (
						<Notice.Root intent="error">
							<Notice.Description>{ createCategoryError }</Notice.Description>
						</Notice.Root>
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
