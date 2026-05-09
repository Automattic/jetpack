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
	TextControl,
	TextareaControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
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

const EXPLICIT_OPTIONS: Array< { label: string; value: string } > = [
	{ label: __( 'No', 'jetpack-podcast' ), value: 'no' },
	{ label: __( 'Yes', 'jetpack-podcast' ), value: 'yes' },
];

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

	// One memoised bag of stable handlers — passed directly into JSX props
	// without re-allocating each render and without per-field useCallback boilerplate.
	const handle = useMemo(
		() => ( {
			category: ( value: string ) => setField( 'podcasting_category_id', Number( value ) || 0 ),
			title: ( value: string ) => setField( 'podcasting_title', value ),
			summary: ( value: string ) => setField( 'podcasting_summary', value ),
			talentName: ( value: string ) => setField( 'podcasting_talent_name', value ),
			copyright: ( value: string ) => setField( 'podcasting_copyright', value ),
			explicit: ( value: string ) => setField( 'podcasting_explicit', value === 'yes' ),
			email: ( value: string ) => setField( 'podcasting_email', value ),
			topics: ( values: ( string | { value: string } )[] ) => {
				// Tokens come back as plain strings or `{ value }` wrappers depending on
				// how they were added; normalise + map display → storage; drop unknowns.
				const stored = values
					.slice( 0, 3 )
					.map( v => ( typeof v === 'string' ? v : v.value ) )
					.map( display => TOPIC_STORAGE_BY_DISPLAY.get( display ) ?? '' );
				setDraft( prev =>
					prev
						? {
								...prev,
								podcasting_category_1: stored[ 0 ] ?? '',
								podcasting_category_2: stored[ 1 ] ?? '',
								podcasting_category_3: stored[ 2 ] ?? '',
						  }
						: prev
				);
			},
			coverImageSelect: ( id: number, url: string ) =>
				setDraft( prev =>
					prev ? { ...prev, podcasting_image: url, podcasting_image_id: id } : prev
				),
			coverImageRemove: () =>
				setDraft( prev =>
					prev ? { ...prev, podcasting_image: '', podcasting_image_id: 0 } : prev
				),
		} ),
		[ setField ]
	);

	const topicValue = useMemo(
		() =>
			[ draft?.podcasting_category_1, draft?.podcasting_category_2, draft?.podcasting_category_3 ]
				.map( storage => ( storage ? TOPIC_DISPLAY_BY_STORAGE.get( storage ) ?? storage : '' ) )
				.filter( ( v ): v is string => !! v ),
		[ draft?.podcasting_category_1, draft?.podcasting_category_2, draft?.podcasting_category_3 ]
	);

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
		setField( 'podcasting_category_id', 0 );
		setConfirmDisable( false );
		// Save immediately — the user already confirmed in the dialog.
		saveSettings( { podcasting_category_id: 0 }, { onSuccess: setDraft } );
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
							onChange={ handle.category }
							options={ [
								{ label: __( '— Select a category —', 'jetpack-podcast' ), value: '' },
								...categories.map( cat => ( { label: cat.name, value: String( cat.id ) } ) ),
							] }
						/>
						<Link openInNewTab href={ getAdminUrl( 'edit-tags.php?taxonomy=category' ) }>
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
							onSelect={ handle.coverImageSelect }
							onRemove={ handle.coverImageRemove }
							disabled={ isSaving }
						/>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Podcast title', 'jetpack-podcast' ) }
							value={ draft.podcasting_title }
							onChange={ handle.title }
						/>
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'Podcast summary', 'jetpack-podcast' ) }
							help={ __(
								'A short description shown in podcast directories. 4000 characters max.',
								'jetpack-podcast'
							) }
							value={ draft.podcasting_summary }
							onChange={ handle.summary }
							rows={ 4 }
						/>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Hosts, artist, or producer', 'jetpack-podcast' ) }
							value={ draft.podcasting_talent_name }
							onChange={ handle.talentName }
						/>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Copyright', 'jetpack-podcast' ) }
							value={ draft.podcasting_copyright }
							onChange={ handle.copyright }
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
						<VStack spacing={ 1 }>
							<FormTokenField
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								__experimentalExpandOnFocus
								label={ __( 'Apple Podcasts categories', 'jetpack-podcast' ) }
								value={ topicValue }
								suggestions={ TOPIC_SUGGESTIONS }
								onChange={ handle.topics }
								maxLength={ 3 }
								disabled={ isSaving }
							/>
							<Text variant="muted">
								{ __(
									'Pick up to three. The first is your primary category and counts most for ranking.',
									'jetpack-podcast'
								) }
							</Text>
						</VStack>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Explicit content', 'jetpack-podcast' ) }
							value={ draft.podcasting_explicit ? 'yes' : 'no' }
							onChange={ handle.explicit }
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
							onChange={ handle.email }
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
