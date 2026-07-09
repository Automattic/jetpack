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
import CategoryPicker from '../category-picker';
import { usePodcastSettings, useUpdatePodcastSettings } from '../hooks/use-podcast-settings';
import { getValidationIssues } from '../hooks/use-validation-issues';
import CoverImageControl from './cover-image-control';
import './style.scss';
import { TOPICS } from './topics';
import type { PodcastSettings, PodcastSettingsUpdate } from '../types';
import type { FocusEvent } from 'react';

const EXPLICIT_OPTIONS: Array< { label: string; value: string } > = [
	{ label: __( 'No', 'jetpack-podcast' ), value: 'no' },
	{ label: __( 'Yes', 'jetpack-podcast' ), value: 'yes' },
];

// Flatten the Apple Podcasts topic tree into one searchable token list for
// `FormTokenField`. Display strings use `Primary » Subtopic` (matching
// Calypso's renderer); storage strings use the legacy `Primary,Subtopic`
// shape (kept for `<itunes:category>` round-tripping). Two maps cover the
// bidirectional translation at save/read time.
const TOPIC_SUGGESTIONS: string[] = [];
const TOPIC_STORAGE_BY_DISPLAY = new Map< string, string >();
const TOPIC_DISPLAY_BY_STORAGE = new Map< string, string >();
const PARENTS_WITH_SUBTOPICS = new Set< string >();
for ( const topic of TOPICS ) {
	TOPIC_SUGGESTIONS.push( topic.label );
	TOPIC_STORAGE_BY_DISPLAY.set( topic.label, topic.key );
	TOPIC_DISPLAY_BY_STORAGE.set( topic.key, topic.label );
	if ( topic.subtopics.length > 0 ) {
		PARENTS_WITH_SUBTOPICS.add( topic.label );
	}
	for ( const sub of topic.subtopics ) {
		const display = `${ topic.label } » ${ sub.label }`;
		const storage = `${ topic.key },${ sub.key }`;
		TOPIC_SUGGESTIONS.push( display );
		TOPIC_STORAGE_BY_DISPLAY.set( display, storage );
		TOPIC_DISPLAY_BY_STORAGE.set( storage, display );
	}
}

const isKnownTopic = ( input: string ): boolean => TOPIC_SUGGESTIONS.includes( input );

const dropRedundantParents = ( displays: string[] ): string[] => {
	const hasSelectedChild = ( parent: string ): boolean =>
		displays.some( other => other.startsWith( `${ parent } » ` ) );
	return displays.filter( d => d.includes( ' » ' ) || ! hasSelectedChild( d ) );
};

const parentsMissingSubtopic = ( displays: string[] ): string[] =>
	displays.filter( d => ! d.includes( ' » ' ) && PARENTS_WITH_SUBTOPICS.has( d ) );

// String-valued setting keys (the ones used by text/textarea/email controls).
type StringFieldKey =
	| 'podcasting_title'
	| 'podcasting_summary'
	| 'podcasting_talent_name'
	| 'podcasting_copyright'
	| 'podcasting_email';

// Per-field editor used by every text/textarea/email control. Holds local
// state per keystroke, then commits on blur if the value differs from what's
// saved. Re-syncs from `stored` when the saved value changes externally.
// Spread directly onto `<TextControl>` etc. for `value` / `onChange` / `onBlur`.
const useFieldEditor = (
	stored: string,
	onCommit: ( value: string ) => void
): { value: string; onChange: ( v: string ) => void; onBlur: () => void } => {
	const [ local, setLocal ] = useState( stored );
	useEffect( () => {
		setLocal( stored );
	}, [ stored ] );
	return {
		value: local,
		onChange: setLocal,
		onBlur: () => {
			if ( local !== stored ) {
				onCommit( local );
			}
		},
	};
};

interface SettingsTabProps {
	onAfterDisable?: () => void;
}

const SettingsTab = ( { onAfterDisable }: SettingsTabProps = {} ) => {
	const { data: settings, isLoading } = usePodcastSettings();
	const { mutate: saveSettings } = useUpdatePodcastSettings();

	const [ draft, setDraft ] = useState< PodcastSettings | null >( null );
	const [ confirmDisable, setConfirmDisable ] = useState( false );

	useEffect( () => {
		if ( settings && ! draft ) {
			setDraft( settings );
		}
	}, [ settings, draft ] );

	// Save a partial update, then resync draft from the server-merged record so
	// `isDirty` and reference checks fall back to false on the saved keys.
	const commit = useCallback(
		( updates: PodcastSettingsUpdate ) => {
			saveSettings( updates, { onSuccess: setDraft } );
		},
		[ saveSettings ]
	);

	// Curry `commit` once per field key so the per-field editor only knows
	// about strings. `useCallback` keeps refs stable for the editor's effect.
	const commitField = useCallback(
		( key: StringFieldKey ) => ( value: string ) =>
			commit( { [ key ]: value } as PodcastSettingsUpdate ),
		[ commit ]
	);

	const titleField = useFieldEditor(
		draft?.podcasting_title ?? '',
		commitField( 'podcasting_title' )
	);
	const summaryField = useFieldEditor(
		draft?.podcasting_summary ?? '',
		commitField( 'podcasting_summary' )
	);
	const talentNameField = useFieldEditor(
		draft?.podcasting_talent_name ?? '',
		commitField( 'podcasting_talent_name' )
	);
	const copyrightField = useFieldEditor(
		draft?.podcasting_copyright ?? '',
		commitField( 'podcasting_copyright' )
	);
	const emailField = useFieldEditor(
		draft?.podcasting_email ?? '',
		commitField( 'podcasting_email' )
	);

	// Discrete-action handlers — these controls "commit" on each user choice
	// (no blur ambiguity), so they save immediately.
	const handleCategorySelect = useCallback(
		( id: number ) => commit( { podcasting_category_id: id } ),
		[ commit ]
	);
	const handleExplicitChange = useCallback(
		( value: string ) => commit( { podcasting_explicit: value === 'yes' } ),
		[ commit ]
	);
	const handleCoverSelect = useCallback(
		( id: number, url: string ) => commit( { podcasting_image: url, podcasting_image_id: id } ),
		[ commit ]
	);
	const handleCoverRemove = useCallback(
		() => commit( { podcasting_image: '', podcasting_image_id: 0 } ),
		[ commit ]
	);
	const topicValue = useMemo(
		() =>
			[ draft?.podcasting_category_1, draft?.podcasting_category_2, draft?.podcasting_category_3 ]
				.map( storage =>
					// Fallback to the raw storage key if a saved value isn't in our
					// flat catalog. Happens when DB holds a category from an older
					// Apple taxonomy revision; surfaces the raw string in the UI
					// instead of dropping the value silently.
					storage ? TOPIC_DISPLAY_BY_STORAGE.get( storage ) ?? storage : ''
				)
				.filter( ( v ): v is string => !! v ),
		[ draft?.podcasting_category_1, draft?.podcasting_category_2, draft?.podcasting_category_3 ]
	);

	// Topics save on blur, not on every chip add/remove. Saving per change
	// caused the suggestions dropdown to close and reopen on each pick: the
	// `value` prop got a fresh reference after the round-trip, which `FormTokenField`
	// reads as a reason to reset its internal state. Holding a local draft until
	// focus leaves the wrapper keeps the dropdown stable while the user picks
	// multiple topics.
	const [ draftTopics, setDraftTopics ] = useState< string[] >( topicValue );

	// Re-sync from server when the saved values change externally (e.g. a
	// successful save merges new data into `draft`, or a different tab updates
	// the settings).
	useEffect( () => {
		setDraftTopics( topicValue );
	}, [ topicValue ] );

	const subtopicHints = useMemo( () => parentsMissingSubtopic( draftTopics ), [ draftTopics ] );

	const handleTopicsChange = useCallback( ( values: ( string | { value: string } )[] ) => {
		const displays = values.map( v => ( typeof v === 'string' ? v : v.value ) );
		setDraftTopics( dropRedundantParents( displays ).slice( 0, 3 ) );
	}, [] );

	const handleTopicsBlur = useCallback(
		( event: FocusEvent< HTMLDivElement > ) => {
			// Focus is bouncing between the input and a suggestion inside the
			// same wrapper — not a real "user is done" signal.
			if ( event.currentTarget.contains( event.relatedTarget as Node | null ) ) {
				return;
			}
			const stored = draftTopics.map( display => TOPIC_STORAGE_BY_DISPLAY.get( display ) ?? '' );
			const next = {
				podcasting_category_1: stored[ 0 ] ?? '',
				podcasting_category_2: stored[ 1 ] ?? '',
				podcasting_category_3: stored[ 2 ] ?? '',
			};
			if (
				next.podcasting_category_1 === ( draft?.podcasting_category_1 ?? '' ) &&
				next.podcasting_category_2 === ( draft?.podcasting_category_2 ?? '' ) &&
				next.podcasting_category_3 === ( draft?.podcasting_category_3 ?? '' )
			) {
				return;
			}
			commit( next );
		},
		[ draftTopics, draft, commit ]
	);

	const issues = useMemo(
		() => getValidationIssues( settings ?? draft ?? undefined ),
		[ settings, draft ]
	);

	const openConfirmDisable = useCallback( () => setConfirmDisable( true ), [] );
	const closeConfirmDisable = useCallback( () => setConfirmDisable( false ), [] );
	const onDisablePodcasting = useCallback( () => {
		setConfirmDisable( false );
		saveSettings( { podcasting_category_id: 0 }, { onSuccess: () => onAfterDisable?.() } );
	}, [ saveSettings, onAfterDisable ] );

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
					<h2 className="podcast__section-heading">{ __( 'Post category', 'jetpack-podcast' ) }</h2>
				</CardHeader>
				<CardBody>
					<VStack spacing={ 3 }>
						<Text variant="muted">
							{ __(
								'Posts in this category are treated as podcast episodes. Add an audio or video block to each one so listeners have something to play.',
								'jetpack-podcast'
							) }
						</Text>
						<CategoryPicker
							selectedId={ draft.podcasting_category_id }
							onSelect={ handleCategorySelect }
						/>
					</VStack>
				</CardBody>
			</Card>

			<Card>
				<CardHeader>
					<h2 className="podcast__section-heading">{ __( 'Show details', 'jetpack-podcast' ) }</h2>
				</CardHeader>
				<CardBody>
					<VStack spacing={ 4 }>
						<Text variant="muted">
							{ __(
								'This information appears in podcast apps like Apple Podcasts and Spotify.',
								'jetpack-podcast'
							) }
						</Text>
						<CoverImageControl
							imageUrl={ draft.podcasting_image }
							imageId={ draft.podcasting_image_id }
							onSelect={ handleCoverSelect }
							onRemove={ handleCoverRemove }
						/>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Title', 'jetpack-podcast' ) }
							{ ...titleField }
						/>
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'Summary/Description', 'jetpack-podcast' ) }
							rows={ 4 }
							{ ...summaryField }
						/>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Hosts/Artist/Producer', 'jetpack-podcast' ) }
							{ ...talentNameField }
						/>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Copyright', 'jetpack-podcast' ) }
							{ ...copyrightField }
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
						<Text variant="muted">
							{ __(
								'Configure how your podcast appears in directories and apps.',
								'jetpack-podcast'
							) }
						</Text>
						<VStack spacing={ 1 }>
							<div onBlur={ handleTopicsBlur }>
								<FormTokenField
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									__experimentalExpandOnFocus
									__experimentalValidateInput={ isKnownTopic }
									__experimentalShowHowTo={ false }
									label={ __( 'Podcast topics', 'jetpack-podcast' ) }
									value={ draftTopics }
									suggestions={ TOPIC_SUGGESTIONS }
									onChange={ handleTopicsChange }
									maxLength={ 3 }
								/>
							</div>
							<Text variant="muted">
								{ __(
									'Choose how your podcast should be categorized within Apple Podcasts and other podcasting services. Pick up to three.',
									'jetpack-podcast'
								) }
							</Text>
							{ subtopicHints.length > 0 && (
								<Notice status="warning" isDismissible={ false }>
									{ __(
										'These categories have subcategories. Picking one helps Apple Podcasts and other directories place your show accurately:',
										'jetpack-podcast'
									) }
									<ul className="podcast__settings-issues">
										{ subtopicHints.map( name => (
											<li key={ name }>{ name }</li>
										) ) }
									</ul>
								</Notice>
							) }
						</VStack>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Explicit content', 'jetpack-podcast' ) }
							value={ draft.podcasting_explicit ? 'yes' : 'no' }
							onChange={ handleExplicitChange }
							options={ EXPLICIT_OPTIONS }
						/>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							type="email"
							label={ __( 'Owner email address', 'jetpack-podcast' ) }
							help={ __(
								'Included in your feed so podcast directories can verify ownership. Most require it for submission.',
								'jetpack-podcast'
							) }
							{ ...emailField }
						/>
					</VStack>
				</CardBody>
			</Card>

			<Card>
				<CardHeader>
					<h2 className="podcast__section-heading">
						{ __( 'Disable podcasting', 'jetpack-podcast' ) }
					</h2>
				</CardHeader>
				<CardBody>
					<VStack spacing={ 3 } alignment="flex-start">
						<Text variant="muted">
							{ __(
								'Stops publishing your podcast feed. Your show details stay saved, so you can set it up again later.',
								'jetpack-podcast'
							) }
						</Text>
						<Button variant="secondary" isDestructive onClick={ openConfirmDisable }>
							{ __( 'Disable', 'jetpack-podcast' ) }
						</Button>
					</VStack>
				</CardBody>
			</Card>

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
