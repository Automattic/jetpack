import { getAdminUrl, getSiteData } from '@automattic/jetpack-script-data';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	FormTokenField,
	Modal,
	Notice,
	SelectControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { DataForm, type Field, type DataFormControlProps } from '@wordpress/dataviews/wp';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { usePodcastSettings, useUpdatePodcastSettings } from '../hooks/use-podcast-settings';
import { getValidationIssues } from '../hooks/use-validation-issues';
import CoverImageControl from './cover-image-control';
import './style.scss';
import { TOPICS } from './topics';
import { useCategoriesQuery } from './use-categories-query';
import type { PodcastSettings } from '../types';

// Flatten the Apple Podcasts topic tree into one searchable token list for
// `FormTokenField`. Display strings use `Primary › Subtopic`; storage strings
// use the legacy `Primary,Subtopic` shape (kept for `<itunes:category>` round-
// tripping). Two maps cover the bidirectional translation at save/read time.
const TOPIC_SUGGESTIONS: string[] = [];
const TOPIC_STORAGE_BY_DISPLAY = new Map< string, string >();
const TOPIC_DISPLAY_BY_STORAGE = new Map< string, string >();
for ( const topic of TOPICS ) {
	TOPIC_SUGGESTIONS.push( topic.label );
	TOPIC_STORAGE_BY_DISPLAY.set( topic.label, topic.key );
	TOPIC_DISPLAY_BY_STORAGE.set( topic.key, topic.label );
	for ( const sub of topic.subtopics ) {
		const display = `${ topic.label } › ${ sub.label }`;
		const storage = `${ topic.key },${ sub.key }`;
		TOPIC_SUGGESTIONS.push( display );
		TOPIC_STORAGE_BY_DISPLAY.set( display, storage );
		TOPIC_DISPLAY_BY_STORAGE.set( storage, display );
	}
}

// Custom Edit components for the fields that don't fit DataForm's built-ins.
// Each receives `{ data, onChange }`; `onChange` accepts a partial that gets
// merged into the parent's setDraft.

const CategoryEdit = ( { data, onChange }: DataFormControlProps< PodcastSettings > ) => {
	const { data: categories = [] } = useCategoriesQuery();
	const handleChange = useCallback(
		( value: string ) => onChange( { podcasting_category_id: Number( value ) || 0 } ),
		[ onChange ]
	);
	return (
		<VStack spacing={ 2 }>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Category for podcast feed', 'jetpack-podcast' ) }
				help={ __(
					'Posts in this category appear in your podcast feed and become episodes.',
					'jetpack-podcast'
				) }
				value={ String( data.podcasting_category_id || '' ) }
				onChange={ handleChange }
				options={ [
					{ label: __( '— Select a category —', 'jetpack-podcast' ), value: '' },
					...categories.map( cat => ( { label: cat.name, value: String( cat.id ) } ) ),
				] }
			/>
			<Link openInNewTab href={ getAdminUrl( 'edit-tags.php?taxonomy=category' ) }>
				{ __( 'Add a new category', 'jetpack-podcast' ) }
			</Link>
		</VStack>
	);
};

const CoverImageEdit = ( { data, onChange }: DataFormControlProps< PodcastSettings > ) => {
	const handleSelect = useCallback(
		( id: number, url: string ) => onChange( { podcasting_image: url, podcasting_image_id: id } ),
		[ onChange ]
	);
	const handleRemove = useCallback(
		() => onChange( { podcasting_image: '', podcasting_image_id: 0 } ),
		[ onChange ]
	);
	return (
		<CoverImageControl
			imageUrl={ data.podcasting_image }
			imageId={ data.podcasting_image_id }
			onSelect={ handleSelect }
			onRemove={ handleRemove }
		/>
	);
};

const TopicsEdit = ( { data, onChange }: DataFormControlProps< PodcastSettings > ) => {
	const value = [
		data.podcasting_category_1,
		data.podcasting_category_2,
		data.podcasting_category_3,
	]
		.map( storage => ( storage ? TOPIC_DISPLAY_BY_STORAGE.get( storage ) ?? storage : '' ) )
		.filter( ( v ): v is string => !! v );
	const handleChange = useCallback(
		( values: ( string | { value: string } )[] ) => {
			const stored = values
				.slice( 0, 3 )
				.map( v => ( typeof v === 'string' ? v : v.value ) )
				.map( display => TOPIC_STORAGE_BY_DISPLAY.get( display ) ?? '' );
			onChange( {
				podcasting_category_1: stored[ 0 ] ?? '',
				podcasting_category_2: stored[ 1 ] ?? '',
				podcasting_category_3: stored[ 2 ] ?? '',
			} );
		},
		[ onChange ]
	);
	return (
		<VStack spacing={ 1 }>
			<FormTokenField
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				__experimentalExpandOnFocus
				label={ __( 'Apple Podcasts categories', 'jetpack-podcast' ) }
				value={ value }
				suggestions={ TOPIC_SUGGESTIONS }
				onChange={ handleChange }
				maxLength={ 3 }
			/>
			<Text variant="muted">
				{ __(
					'Pick up to three. The first is your primary category and counts most for ranking.',
					'jetpack-podcast'
				) }
			</Text>
		</VStack>
	);
};

const ExplicitEdit = ( { data, onChange }: DataFormControlProps< PodcastSettings > ) => {
	const handleChange = useCallback(
		( value: string ) => onChange( { podcasting_explicit: value === 'yes' } ),
		[ onChange ]
	);
	return (
		<SelectControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ __( 'Explicit content', 'jetpack-podcast' ) }
			value={ data.podcasting_explicit ? 'yes' : 'no' }
			onChange={ handleChange }
			options={ [
				{ label: __( 'No', 'jetpack-podcast' ), value: 'no' },
				{ label: __( 'Yes', 'jetpack-podcast' ), value: 'yes' },
			] }
		/>
	);
};

// Field declarations — id matches the storage key so DataForm can read/write
// directly via `data[id]`. `Edit` is either a built-in control name or a
// custom component for the special cases above.
const FIELDS: Field< PodcastSettings >[] = [
	{ id: 'podcasting_category_id', Edit: CategoryEdit },
	{ id: 'podcasting_image', Edit: CoverImageEdit },
	{
		id: 'podcasting_title',
		label: __( 'Podcast title', 'jetpack-podcast' ),
		Edit: 'text',
	},
	{
		id: 'podcasting_summary',
		label: __( 'Podcast summary', 'jetpack-podcast' ),
		description: __(
			'A short description shown in podcast directories. 4000 characters max.',
			'jetpack-podcast'
		),
		Edit: { control: 'textarea', rows: 4 },
	},
	{
		id: 'podcasting_talent_name',
		label: __( 'Hosts, artist, or producer', 'jetpack-podcast' ),
		Edit: 'text',
	},
	{
		id: 'podcasting_copyright',
		label: __( 'Copyright', 'jetpack-podcast' ),
		Edit: 'text',
	},
	{ id: 'podcasting_category_1', Edit: TopicsEdit },
	{ id: 'podcasting_explicit', Edit: ExplicitEdit },
	{
		id: 'podcasting_email',
		label: __( 'Owner email', 'jetpack-podcast' ),
		description: __(
			'Apple Podcasts and other directories use this address to verify ownership.',
			'jetpack-podcast'
		),
		Edit: 'email',
	},
];

const FORM_LAYOUT = { type: 'regular' as const, labelPosition: 'top' as const };

const CATEGORY_FORM = { layout: FORM_LAYOUT, fields: [ 'podcasting_category_id' ] };
const SHOW_DETAILS_FORM = {
	layout: FORM_LAYOUT,
	fields: [
		'podcasting_image',
		'podcasting_title',
		'podcasting_summary',
		'podcasting_talent_name',
		'podcasting_copyright',
	],
};
const FEED_SETTINGS_FORM = {
	layout: FORM_LAYOUT,
	fields: [ 'podcasting_category_1', 'podcasting_explicit', 'podcasting_email' ],
};

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

	const onChange = useCallback( ( updates: Partial< PodcastSettings > ) => {
		setDraft( prev => ( prev ? { ...prev, ...updates } : prev ) );
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
		// Resync draft from the server response so isDirty falls back to false
		// (especially for `podcasting_show_urls` where the server returns a
		// fresh object reference each save).
		saveSettings( draft, { onSuccess: setDraft } );
	}, [ draft, saveSettings ] );

	const onDisablePodcasting = useCallback( () => {
		setConfirmDisable( false );
		// Save immediately — the user already confirmed in the dialog.
		saveSettings( { podcasting_category_id: 0 }, { onSuccess: setDraft } );
	}, [ saveSettings ] );

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
					<DataForm< PodcastSettings >
						data={ draft }
						fields={ FIELDS }
						form={ CATEGORY_FORM }
						onChange={ onChange }
					/>
				</CardBody>
			</Card>

			<Card>
				<CardHeader>
					<h2 className="podcast__section-heading">{ __( 'Show details', 'jetpack-podcast' ) }</h2>
				</CardHeader>
				<CardBody>
					<DataForm< PodcastSettings >
						data={ draft }
						fields={ FIELDS }
						form={ SHOW_DETAILS_FORM }
						onChange={ onChange }
					/>
				</CardBody>
			</Card>

			<Card>
				<CardHeader>
					<h2 className="podcast__section-heading">{ __( 'Feed settings', 'jetpack-podcast' ) }</h2>
				</CardHeader>
				<CardBody>
					<DataForm< PodcastSettings >
						data={ draft }
						fields={ FIELDS }
						form={ FEED_SETTINGS_FORM }
						onChange={ onChange }
					/>
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
