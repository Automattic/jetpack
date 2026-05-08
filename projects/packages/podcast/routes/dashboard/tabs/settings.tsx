/**
 * Settings tab — podcast metadata form.
 *
 * Mirrors `client/my-sites/podcast/components/settings.tsx` from Calypso, but
 * persists through `usePodcastSettings`/`useUpdatePodcastSettings` (TanStack
 * Query) instead of the Calypso `wrapSettingsForm` HOC. Validation matches
 * the Apple Podcasts requirements: title, summary, talent name, owner email,
 * primary topic, and a 1400–3000px square cover image.
 */

import { getSiteData } from '@automattic/jetpack-script-data';
import {
	BaseControl,
	Button,
	Card,
	CardBody,
	CardHeader,
	Modal,
	Notice,
	SelectControl,
	TextControl,
	TextareaControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import CoverImageControl from '../components/cover-image-control';
import { useCategoriesQuery, useCreateCategory } from '../hooks/use-categories-query';
import { usePodcastSettings, useUpdatePodcastSettings } from '../hooks/use-podcast-settings';
import { getValidationIssues } from '../hooks/use-validation-issues';
import { TOPICS, type Topic } from '../topics';
import type { PodcastSettings, ExplicitValue } from '../types';

const EXPLICIT_OPTIONS: Array< { label: string; value: ExplicitValue } > = [
	{ label: __( 'No', 'jetpack-podcast' ), value: 'no' },
	{ label: __( 'Yes', 'jetpack-podcast' ), value: 'yes' },
	{ label: __( 'Clean', 'jetpack-podcast' ), value: 'clean' },
];

const TOPICS_FIELD_ID = 'jetpack-podcast-topics';

const splitStored = ( stored: string ): { primary: string; sub: string } => {
	// Legacy WPCOM podcast data is HTML-entity encoded ("Fashion &amp; Beauty"),
	// while topics.ts catalog keys are raw ("Fashion & Beauty"). Decode here so
	// the dropdown finds a matching option for both legacy-encoded and SPA-raw
	// stored values. On save we always write raw, so re-saving migrates the
	// stored value to canonical form.
	const [ primary = '', sub = '' ] = stored.split( ',' ).map( s => decodeEntities( s.trim() ) );
	return { primary, sub };
};

const joinStored = ( primary: string, sub: string ): string => {
	if ( ! primary ) {
		return '';
	}
	return sub ? `${ primary },${ sub }` : primary;
};

interface TopicPickerProps {
	value: string;
	onChange: ( next: string ) => void;
	label: string;
	disabled?: boolean;
}

const TopicPicker = ( { value, onChange, label, disabled }: TopicPickerProps ) => {
	const { primary, sub } = splitStored( value );
	const selectedTopic = TOPICS.find( ( t: Topic ) => t.key === primary );
	const subOptions = selectedTopic?.subtopics ?? [];

	const onPrimaryChange = useCallback(
		( next: string ) => {
			onChange( joinStored( next, '' ) );
		},
		[ onChange ]
	);

	const onSubChange = useCallback(
		( next: string ) => {
			onChange( joinStored( primary, next ) );
		},
		[ onChange, primary ]
	);

	return (
		<HStack alignment="flex-end" spacing={ 3 }>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ label }
				value={ primary }
				disabled={ disabled }
				onChange={ onPrimaryChange }
				options={ [
					{ label: __( '— Select category —', 'jetpack-podcast' ), value: '' },
					...TOPICS.map( ( topic: Topic ) => ( { label: topic.label, value: topic.key } ) ),
				] }
			/>
			{ subOptions.length > 0 && (
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Subcategory', 'jetpack-podcast' ) }
					value={ sub }
					disabled={ disabled }
					onChange={ onSubChange }
					options={ [
						{ label: __( '— Optional —', 'jetpack-podcast' ), value: '' },
						...subOptions.map( s => ( { label: s.label, value: s.key } ) ),
					] }
				/>
			) }
		</HStack>
	);
};

const SettingsTab = () => {
	const { data: settings, isLoading } = usePodcastSettings();
	const { mutate: saveSettings, isPending: isSaving } = useUpdatePodcastSettings();

	const [ draft, setDraft ] = useState< PodcastSettings | null >( null );
	const [ isCreatingCategory, setIsCreatingCategory ] = useState( false );
	const [ newCategoryName, setNewCategoryName ] = useState( '' );
	const [ confirmDisable, setConfirmDisable ] = useState( false );

	useEffect( () => {
		if ( settings && ! draft ) {
			// Pre-fill the title with the site's blogname for sites that haven't
			// been set up yet — saves the user a step and gives them a sensible
			// default to edit. Skipped if the site already has a podcast configured
			// so we don't undo a deliberate empty title.
			const isFreshSetup = ! settings.podcasting_category_id && ! settings.podcasting_title;
			if ( isFreshSetup ) {
				const siteName = getSiteData()?.title?.trim() ?? '';
				if ( siteName ) {
					setDraft( { ...settings, podcasting_title: siteName } );
					return;
				}
			}
			setDraft( settings );
		}
	}, [ settings, draft ] );

	const { data: categories = [] } = useCategoriesQuery();
	const { mutateAsync: createCategoryAsync, isPending: isCreatingCategoryPending } =
		useCreateCategory();

	const setField = useCallback(
		< K extends keyof PodcastSettings >( key: K, value: PodcastSettings[ K ] ) => {
			setDraft( prev => ( prev ? { ...prev, [ key ]: value } : prev ) );
		},
		[]
	);

	// Per-field stable handlers — `useCallback`'d once with `setField` as the
	// only dep so they can be passed straight to JSX without re-allocating
	// every render.
	const onCategoryIdChange = useCallback(
		( value: string ) => setField( 'podcasting_category_id', Number( value ) || 0 ),
		[ setField ]
	);
	const onTitleChange = useCallback(
		( value: string ) => setField( 'podcasting_title', value ),
		[ setField ]
	);
	const onSummaryChange = useCallback(
		( value: string ) => setField( 'podcasting_summary', value ),
		[ setField ]
	);
	const onTalentNameChange = useCallback(
		( value: string ) => setField( 'podcasting_talent_name', value ),
		[ setField ]
	);
	const onCopyrightChange = useCallback(
		( value: string ) => setField( 'podcasting_copyright', value ),
		[ setField ]
	);
	const onExplicitChange = useCallback(
		( value: string ) => setField( 'podcasting_explicit', value as ExplicitValue ),
		[ setField ]
	);
	const onEmailChange = useCallback(
		( value: string ) => setField( 'podcasting_email', value ),
		[ setField ]
	);
	const onTopic1Change = useCallback(
		( value: string ) => setField( 'podcasting_category_1', value ),
		[ setField ]
	);
	const onTopic2Change = useCallback(
		( value: string ) => setField( 'podcasting_category_2', value ),
		[ setField ]
	);
	const onTopic3Change = useCallback(
		( value: string ) => setField( 'podcasting_category_3', value ),
		[ setField ]
	);

	const onCoverImageSelect = useCallback( ( id: number, url: string ) => {
		setDraft( prev =>
			prev ? { ...prev, podcasting_image: url, podcasting_image_id: id } : prev
		);
	}, [] );

	const onCoverImageRemove = useCallback( () => {
		setDraft( prev => ( prev ? { ...prev, podcasting_image: '', podcasting_image_id: 0 } : prev ) );
	}, [] );

	const openCreateCategory = useCallback( () => setIsCreatingCategory( true ), [] );
	const closeCreateCategory = useCallback( () => setIsCreatingCategory( false ), [] );
	const openConfirmDisable = useCallback( () => setConfirmDisable( true ), [] );
	const closeConfirmDisable = useCallback( () => setConfirmDisable( false ), [] );

	const isDirty = useMemo( () => {
		if ( ! settings || ! draft ) {
			return false;
		}
		return ( Object.keys( draft ) as Array< keyof PodcastSettings > ).some(
			key => draft[ key ] !== settings[ key ]
		);
	}, [ settings, draft ] );

	const issues = useMemo( () => getValidationIssues( draft ?? settings ), [ draft, settings ] );

	const onSave = useCallback( () => {
		if ( ! draft ) {
			return;
		}
		saveSettings( draft );
	}, [ draft, saveSettings ] );

	const onCreateCategory = useCallback( async () => {
		const name = newCategoryName.trim();
		if ( ! name ) {
			return;
		}
		const term = await createCategoryAsync( name );
		setField( 'podcasting_category_id', term.id );
		setNewCategoryName( '' );
		setIsCreatingCategory( false );
	}, [ newCategoryName, createCategoryAsync, setField ] );

	const onDisablePodcasting = useCallback( () => {
		setField( 'podcasting_category_id', 0 );
		setConfirmDisable( false );
		// Push the disable through immediately rather than waiting for a manual save click —
		// the user explicitly confirmed.
		saveSettings( { podcasting_category_id: 0 } );
	}, [ setField, saveSettings ] );

	if ( isLoading || ! draft ) {
		return null;
	}

	return (
		<VStack spacing={ 5 } className="podcast__settings">
			{ issues.length > 0 && (
				<Notice status="warning" isDismissible={ false }>
					<strong>{ __( 'Finish setting up your podcast', 'jetpack-podcast' ) }</strong>
					<ul className="podcast__settings-issues">
						{ issues.map( issue => (
							<li key={ issue }>{ issue }</li>
						) ) }
					</ul>
				</Notice>
			) }

			<Card>
				<CardHeader>
					<h2 className="podcast__section-heading">
						{ __( 'Podcast category', 'jetpack-podcast' ) }
					</h2>
				</CardHeader>
				<CardBody>
					<HStack alignment="flex-end" spacing={ 3 }>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Category for podcast feed', 'jetpack-podcast' ) }
							help={ __(
								'Posts in this category appear in your podcast feed and become episodes.',
								'jetpack-podcast'
							) }
							value={ String( draft.podcasting_category_id || '' ) }
							onChange={ onCategoryIdChange }
							options={ [
								{ label: __( '— Select a category —', 'jetpack-podcast' ), value: '' },
								...categories.map( cat => ( { label: cat.name, value: String( cat.id ) } ) ),
							] }
						/>
						<Button variant="secondary" onClick={ openCreateCategory }>
							{ __( 'New category', 'jetpack-podcast' ) }
						</Button>
					</HStack>
				</CardBody>
			</Card>

			<Card>
				<CardHeader>
					<h2 className="podcast__section-heading">{ __( 'Show details', 'jetpack-podcast' ) }</h2>
				</CardHeader>
				<CardBody>
					<VStack spacing={ 4 }>
						<CoverImageControl
							imageUrl={ draft.podcasting_image }
							imageId={ draft.podcasting_image_id }
							onSelect={ onCoverImageSelect }
							onRemove={ onCoverImageRemove }
							disabled={ isSaving }
						/>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Podcast title', 'jetpack-podcast' ) }
							value={ draft.podcasting_title }
							onChange={ onTitleChange }
						/>
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'Podcast summary', 'jetpack-podcast' ) }
							help={ __(
								'A short description shown in podcast directories. 4000 characters max.',
								'jetpack-podcast'
							) }
							value={ draft.podcasting_summary }
							onChange={ onSummaryChange }
							rows={ 4 }
						/>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Hosts, artist, or producer', 'jetpack-podcast' ) }
							value={ draft.podcasting_talent_name }
							onChange={ onTalentNameChange }
						/>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Copyright', 'jetpack-podcast' ) }
							value={ draft.podcasting_copyright }
							onChange={ onCopyrightChange }
						/>
					</VStack>
				</CardBody>
			</Card>

			<Card>
				<CardHeader>
					<h2 className="podcast__section-heading">{ __( 'Feed settings', 'jetpack-podcast' ) }</h2>
				</CardHeader>
				<CardBody>
					<VStack spacing={ 4 }>
						<BaseControl
							id={ TOPICS_FIELD_ID }
							__nextHasNoMarginBottom
							label={ __( 'Apple Podcasts categories', 'jetpack-podcast' ) }
							help={ __(
								'Pick up to three. The first is your primary category and counts most for ranking.',
								'jetpack-podcast'
							) }
						>
							<VStack spacing={ 3 }>
								<TopicPicker
									value={ draft.podcasting_category_1 }
									onChange={ onTopic1Change }
									label={ sprintf(
										/* translators: %d is the slot number (1-3). */
										__( 'Category %d', 'jetpack-podcast' ),
										1
									) }
									disabled={ isSaving }
								/>
								<TopicPicker
									value={ draft.podcasting_category_2 }
									onChange={ onTopic2Change }
									label={ sprintf(
										/* translators: %d is the slot number (1-3). */
										__( 'Category %d', 'jetpack-podcast' ),
										2
									) }
									disabled={ isSaving }
								/>
								<TopicPicker
									value={ draft.podcasting_category_3 }
									onChange={ onTopic3Change }
									label={ sprintf(
										/* translators: %d is the slot number (1-3). */
										__( 'Category %d', 'jetpack-podcast' ),
										3
									) }
									disabled={ isSaving }
								/>
							</VStack>
						</BaseControl>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Explicit content', 'jetpack-podcast' ) }
							value={ draft.podcasting_explicit }
							onChange={ onExplicitChange }
							options={ EXPLICIT_OPTIONS }
						/>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							type="email"
							label={ __( 'Owner email', 'jetpack-podcast' ) }
							help={ __(
								'Apple Podcasts and other directories use this address to verify ownership.',
								'jetpack-podcast'
							) }
							value={ draft.podcasting_email }
							onChange={ onEmailChange }
						/>
					</VStack>
				</CardBody>
			</Card>

			<HStack justify="flex-end" spacing={ 3 }>
				{ draft.podcasting_category_id > 0 && (
					<Button variant="link" isDestructive onClick={ openConfirmDisable } disabled={ isSaving }>
						{ __( 'Disable podcasting', 'jetpack-podcast' ) }
					</Button>
				) }
				<Button
					variant="primary"
					onClick={ onSave }
					isBusy={ isSaving }
					disabled={ isSaving || ! isDirty }
				>
					{ __( 'Save changes', 'jetpack-podcast' ) }
				</Button>
			</HStack>

			{ isCreatingCategory && (
				<Modal
					title={ __( 'Add a new category', 'jetpack-podcast' ) }
					onRequestClose={ closeCreateCategory }
				>
					<VStack spacing={ 4 }>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Category name', 'jetpack-podcast' ) }
							value={ newCategoryName }
							onChange={ setNewCategoryName }
						/>
						<HStack justify="flex-end" spacing={ 3 }>
							<Button variant="tertiary" onClick={ closeCreateCategory }>
								{ __( 'Cancel', 'jetpack-podcast' ) }
							</Button>
							<Button
								variant="primary"
								onClick={ onCreateCategory }
								isBusy={ isCreatingCategoryPending }
								disabled={ isCreatingCategoryPending || ! newCategoryName.trim() }
							>
								{ __( 'Create category', 'jetpack-podcast' ) }
							</Button>
						</HStack>
					</VStack>
				</Modal>
			) }

			{ confirmDisable && (
				<Modal
					title={ __( 'Disable podcasting?', 'jetpack-podcast' ) }
					onRequestClose={ closeConfirmDisable }
				>
					<VStack spacing={ 4 }>
						<p>
							{ __(
								'Your podcast feed will stop being generated. Existing episodes stay in the assigned category and you can turn podcasting back on at any time.',
								'jetpack-podcast'
							) }
						</p>
						<HStack justify="flex-end" spacing={ 3 }>
							<Button variant="tertiary" onClick={ closeConfirmDisable }>
								{ __( 'Cancel', 'jetpack-podcast' ) }
							</Button>
							<Button variant="primary" isDestructive onClick={ onDisablePodcasting }>
								{ __( 'Disable podcasting', 'jetpack-podcast' ) }
							</Button>
						</HStack>
					</VStack>
				</Modal>
			) }
		</VStack>
	);
};

export default SettingsTab;
