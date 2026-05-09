import { getAdminUrl, getSiteData } from '@automattic/jetpack-script-data';
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
	TreeSelect,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { usePodcastSettings, useUpdatePodcastSettings } from '../hooks/use-podcast-settings';
import { getValidationIssues } from '../hooks/use-validation-issues';
import CoverImageControl from './cover-image-control';
import './style.scss';
import { TOPICS } from './topics';
import { useCategoriesQuery } from './use-categories-query';
import type { PodcastSettings } from '../types';

const EXPLICIT_OPTIONS: Array< { label: string; value: string } > = [
	{ label: __( 'No', 'jetpack-podcast' ), value: 'no' },
	{ label: __( 'Yes', 'jetpack-podcast' ), value: 'yes' },
];

const TOPICS_FIELD_ID = 'jetpack-podcast-topics';

// Each subtopic id is `"Primary,Subtopic"` so it round-trips with the stored
// `<itunes:category>` format directly — no parse/join helpers needed.
const TOPIC_TREE = TOPICS.map( topic => ( {
	id: topic.key,
	name: topic.label,
	children: topic.subtopics.map( sub => ( {
		id: `${ topic.key },${ sub.key }`,
		name: sub.label,
	} ) ),
} ) );

const SettingsTab = () => {
	const { data: settings, isLoading } = usePodcastSettings();
	const { mutate: saveSettings, isPending: isSaving } = useUpdatePodcastSettings();

	const [ draft, setDraft ] = useState< PodcastSettings | null >( null );
	const [ confirmDisable, setConfirmDisable ] = useState( false );

	useEffect( () => {
		if ( settings && ! draft ) {
			// Pre-fill title from blogname for sites that haven't been set up yet.
			// Guarded so a deliberate empty title on a configured podcast is preserved.
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

	const setField = useCallback(
		< K extends keyof PodcastSettings >( key: K, value: PodcastSettings[ K ] ) => {
			setDraft( prev => ( prev ? { ...prev, [ key ]: value } : prev ) );
		},
		[]
	);

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
		( value: string ) => setField( 'podcasting_explicit', value === 'yes' ),
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

	const onDisablePodcasting = useCallback( () => {
		setField( 'podcasting_category_id', 0 );
		setConfirmDisable( false );
		// Save immediately — the user already confirmed in the dialog.
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
					<VStack spacing={ 2 }>
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
						<Link
							openInNewTab
							href={ getAdminUrl( 'edit-tags.php?taxonomy=category' ) }
							children={ null }
						>
							{ __( 'Add a new category', 'jetpack-podcast' ) }
						</Link>
					</VStack>
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
								<TreeSelect
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={ sprintf(
										/* translators: %d is the slot number (1-3). */
										__( 'Category %d', 'jetpack-podcast' ),
										1
									) }
									noOptionLabel={ __( '— Select category —', 'jetpack-podcast' ) }
									tree={ TOPIC_TREE }
									selectedId={ draft.podcasting_category_1 }
									onChange={ onTopic1Change }
									disabled={ isSaving }
								/>
								<TreeSelect
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={ sprintf(
										/* translators: %d is the slot number (1-3). */
										__( 'Category %d', 'jetpack-podcast' ),
										2
									) }
									noOptionLabel={ __( '— Select category —', 'jetpack-podcast' ) }
									tree={ TOPIC_TREE }
									selectedId={ draft.podcasting_category_2 }
									onChange={ onTopic2Change }
									disabled={ isSaving }
								/>
								<TreeSelect
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									label={ sprintf(
										/* translators: %d is the slot number (1-3). */
										__( 'Category %d', 'jetpack-podcast' ),
										3
									) }
									noOptionLabel={ __( '— Select category —', 'jetpack-podcast' ) }
									tree={ TOPIC_TREE }
									selectedId={ draft.podcasting_category_3 }
									onChange={ onTopic3Change }
									disabled={ isSaving }
								/>
							</VStack>
						</BaseControl>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Explicit content', 'jetpack-podcast' ) }
							value={ draft.podcasting_explicit ? 'yes' : 'no' }
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
