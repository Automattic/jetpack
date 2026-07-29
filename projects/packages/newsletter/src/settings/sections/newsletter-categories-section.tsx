/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getSiteData, getSiteType, isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { WpcomSupportLink } from '@automattic/jetpack-shared-extension-utils/components/wpcom-support-link';
import { TextControl } from '@wordpress/components';
import { DataForm, type Field, useFormValidity } from '@wordpress/dataviews';
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card, Fieldset, Link, Notice, Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { createCategory, fetchCategories } from '../api';
import type { NewsletterSettings, WordPressCategory } from '../types';
import type { KeyboardEvent } from 'react';

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

	// Inline "add new category" flow. Replaces the old wp-admin link so the new
	// category is created in place and shows up in the list without a refresh.
	const [ isAddingCategory, setIsAddingCategory ] = useState( false );
	const [ newCategoryName, setNewCategoryName ] = useState( '' );
	const [ isCreatingCategory, setIsCreatingCategory ] = useState( false );
	const [ createCategoryError, setCreateCategoryError ] = useState< string | null >( null );

	// Focus targets for the disclosure pattern: move focus into the form on open,
	// return it to the trigger on close.
	const newCategoryInputRef = useRef< HTMLInputElement >( null );
	const addCategoryTriggerRef = useRef< HTMLButtonElement >( null );
	const wasAddingCategoryRef = useRef( false );

	// Latest saved selection, read inside the async create handler so a category
	// the user toggles while the request is in flight isn't clobbered by a stale
	// closure over `data.wpcom_newsletter_categories`.
	const selectedCategoriesRef = useRef( data.wpcom_newsletter_categories );
	useEffect( () => {
		selectedCategoriesRef.current = data.wpcom_newsletter_categories;
	}, [ data.wpcom_newsletter_categories ] );

	// Move focus into the form when it opens; return it to the trigger on close
	// (but not on the initial render, when the form was never open).
	useEffect( () => {
		if ( isAddingCategory ) {
			newCategoryInputRef.current?.focus();
		} else if ( wasAddingCategoryRef.current ) {
			addCategoryTriggerRef.current?.focus();
		}
		wasAddingCategoryRef.current = isAddingCategory;
	}, [ isAddingCategory ] );

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

	const trimmedNewCategoryName = newCategoryName.trim();

	// Open the inline add-category form.
	const startAddCategory = useCallback( () => {
		setIsAddingCategory( true );
	}, [] );

	// Reset and close the inline add-category form.
	const cancelAddCategory = useCallback( () => {
		setIsAddingCategory( false );
		setNewCategoryName( '' );
		setCreateCategoryError( null );
	}, [] );

	// Create the category, append it to the list, and auto-select it.
	const handleCreateCategory = useCallback( () => {
		if ( ! trimmedNewCategoryName || isCreatingCategory ) {
			return;
		}

		setIsCreatingCategory( true );
		setCreateCategoryError( null );

		createCategory( trimmedNewCategoryName )
			.then( created => {
				const newCategory: WordPressCategory = {
					id: String( created.id ),
					name: created.name,
				};

				// Add to the local list so it appears in the DataForm without a
				// page refresh, avoiding duplicates if it somehow already exists.
				setCategories( prev =>
					prev.some( cat => cat.id === newCategory.id ) ? prev : [ ...prev, newCategory ]
				);

				// Auto-select the newly created category (staged for save). Read the
				// latest selection from the ref so a concurrent toggle isn't lost.
				const selected = selectedCategoriesRef.current ?? [];
				if ( ! selected.includes( newCategory.id ) ) {
					onChange( { wpcom_newsletter_categories: [ ...selected, newCategory.id ] } );
				}

				setIsAddingCategory( false );
				setNewCategoryName( '' );
			} )
			.catch( ( err: Error ) => {
				// Duplicate-name detection differs by platform: self-hosted WP REST
				// (`/wp/v2/categories`) rejects with `code: 'term_exists'`, while the
				// WordPress.com v1.1 endpoint used on Simple sites rejects with
				// `error: 'duplicate'`. Both carry a long, English-only server message
				// (and the inline form has no parent picker), so map either one to a
				// short, translated string. Everything else (permissions, expired
				// nonce, network failure) gets a friendly generic message rather than
				// the raw server text.
				const errorCode =
					( err as Error & { code?: string; error?: string } )?.code ??
					( err as Error & { error?: string } )?.error;
				const isDuplicate = errorCode === 'term_exists' || errorCode === 'duplicate';
				// Assign each translated string to its own variable rather than
				// branching a single ternary between two `__()` calls: production
				// minification hoists the shared `__( …, 'jetpack-newsletter' )`
				// wrapper out of the conditional, leaving a non-literal msgid that
				// fails the i18n string check.
				const duplicateMessage = __( 'This category already exists.', 'jetpack-newsletter' );
				const genericMessage = __(
					'Could not create the category. Please try again.',
					'jetpack-newsletter'
				);
				setCreateCategoryError( isDuplicate ? duplicateMessage : genericMessage );
			} )
			.finally( () => {
				setIsCreatingCategory( false );
			} );
	}, [ trimmedNewCategoryName, isCreatingCategory, onChange ] );

	// Submit the inline form on Enter, matching the category token field above
	// it. `handleCreateCategory` already no-ops on an empty name or while a
	// create is in flight, so no extra guard is needed here.
	const handleNewCategoryKeyDown = useCallback(
		( event: KeyboardEvent< HTMLInputElement > ) => {
			if ( event.key === 'Enter' ) {
				event.preventDefault();
				handleCreateCategory();
			}
		},
		[ handleCreateCategory ]
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

					{ data.wpcom_newsletter_categories_enabled &&
						( isAddingCategory ? (
							<Stack direction="column" gap="sm" className="newsletter-add-category-form">
								{ createCategoryError && (
									<Notice.Root intent="error">
										<Notice.Description>{ createCategoryError }</Notice.Description>
									</Notice.Root>
								) }
								<TextControl
									ref={ newCategoryInputRef }
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={ __( 'New category name', 'jetpack-newsletter' ) }
									value={ newCategoryName }
									onChange={ setNewCategoryName }
									onKeyDown={ handleNewCategoryKeyDown }
									disabled={ isCreatingCategory }
								/>
								<Stack direction="row" gap="sm" align="center" justify="flex-start">
									<Button
										variant="solid"
										onClick={ handleCreateCategory }
										disabled={ ! trimmedNewCategoryName || isCreatingCategory }
										loading={ isCreatingCategory }
										loadingAnnouncement={ __( 'Adding…', 'jetpack-newsletter' ) }
									>
										{ __( 'Add category', 'jetpack-newsletter' ) }
									</Button>
									<Button
										variant="minimal"
										onClick={ cancelAddCategory }
										disabled={ isCreatingCategory }
									>
										{ __( 'Cancel', 'jetpack-newsletter' ) }
									</Button>
								</Stack>
							</Stack>
						) : (
							<p>
								<Button
									ref={ addCategoryTriggerRef }
									variant="unstyled"
									className="newsletter-add-category-trigger"
									onClick={ startAddCategory }
								>
									{ __( 'Add new category', 'jetpack-newsletter' ) }
								</Button>
							</p>
						) ) }
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
