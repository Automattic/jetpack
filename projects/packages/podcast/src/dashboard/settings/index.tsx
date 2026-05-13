import { getAdminUrl } from '@automattic/jetpack-script-data';
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
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { usePodcastSettings, useUpdatePodcastSettings } from '../hooks/use-podcast-settings';
import { getValidationIssues } from '../hooks/use-validation-issues';
import CoverImageControl from './cover-image-control';
import './style.scss';
import { TOPICS } from './topics';
import { useCategoriesQuery } from './use-categories-query';
import type { PodcastSettings, PodcastSettingsUpdate } from '../types';

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
for ( const topic of TOPICS ) {
	TOPIC_SUGGESTIONS.push( topic.label );
	TOPIC_STORAGE_BY_DISPLAY.set( topic.label, topic.key );
	TOPIC_DISPLAY_BY_STORAGE.set( topic.key, topic.label );
	for ( const sub of topic.subtopics ) {
		const display = `${ topic.label } » ${ sub.label }`;
		const storage = `${ topic.key },${ sub.key }`;
		TOPIC_SUGGESTIONS.push( display );
		TOPIC_STORAGE_BY_DISPLAY.set( display, storage );
		TOPIC_DISPLAY_BY_STORAGE.set( storage, display );
	}
}

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

const SettingsTab = () => {
	const { data: settings, isLoading } = usePodcastSettings();
	const { mutate: saveSettings } = useUpdatePodcastSettings();

	const [ draft, setDraft ] = useState< PodcastSettings | null >( null );
	const [ confirmDisable, setConfirmDisable ] = useState( false );

	useEffect( () => {
		if ( settings && ! draft ) {
			setDraft( settings );
		}
	}, [ settings, draft ] );

	const { data: categories = [] } = useCategoriesQuery();

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
	const handleCategoryChange = useCallback(
		( value: string ) => commit( { podcasting_category_id: Number( value ) || 0 } ),
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

	// Calypso renders three native selects, one per slot, so each pick closes
	// its dropdown and saves discretely. We use a single `FormTokenField` but
	// match that UX: save on every change, then blur the input so the
	// suggestions list closes before the save's re-render lands. Without the
	// blur, the open list visibly flickers when the field receives a fresh
	// `value` prop reference.
	//
	// The `querySelector('input')` below relies on `FormTokenField` rendering
	// exactly one `<input>` inside the wrapper div. If that internal shape
	// changes upstream, this becomes a no-op (no thrown error) but the flicker
	// returns; replace with a forwarded ref API if `@wordpress/components`
	// gains one.
	const topicFieldRef = useRef< HTMLDivElement >( null );

	const handleTopicsChange = useCallback(
		( values: ( string | { value: string } )[] ) => {
			const stored = values
				.slice( 0, 3 )
				.map( v => ( typeof v === 'string' ? v : v.value ) )
				.map( display => TOPIC_STORAGE_BY_DISPLAY.get( display ) ?? '' );
			commit( {
				podcasting_category_1: stored[ 0 ] ?? '',
				podcasting_category_2: stored[ 1 ] ?? '',
				podcasting_category_3: stored[ 2 ] ?? '',
			} );
			topicFieldRef.current?.querySelector< HTMLInputElement >( 'input' )?.blur();
		},
		[ commit ]
	);

	const issues = useMemo( () => getValidationIssues( draft ?? settings ), [ draft, settings ] );

	const openConfirmDisable = useCallback( () => setConfirmDisable( true ), [] );
	const closeConfirmDisable = useCallback( () => setConfirmDisable( false ), [] );
	const onDisablePodcasting = useCallback( () => {
		setConfirmDisable( false );
		commit( { podcasting_category_id: 0 } );
	}, [ commit ] );

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
					<VStack spacing={ 3 }>
						<Text variant="muted">
							{ __(
								'Posts in this category are treated as podcast episodes. Add an audio or video block to each one so listeners have something to play.',
								'jetpack-podcast'
							) }
						</Text>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Podcast category', 'jetpack-podcast' ) }
							hideLabelFromVision
							value={ String( draft.podcasting_category_id || '' ) }
							onChange={ handleCategoryChange }
							options={ [
								{ label: __( '— Select a category —', 'jetpack-podcast' ), value: '' },
								...categories.map( cat => ( { label: cat.name, value: String( cat.id ) } ) ),
							] }
						/>
						<Link openInNewTab href={ getAdminUrl( 'edit-tags.php?taxonomy=category' ) }>
							{ __( 'Create a new category', 'jetpack-podcast' ) }
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
							<div ref={ topicFieldRef }>
								<FormTokenField
									__next40pxDefaultSize
									__nextHasNoMarginBottom
									__experimentalExpandOnFocus
									label={ __( 'Podcast topics', 'jetpack-podcast' ) }
									value={ topicValue }
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
							label={ __( 'Email address', 'jetpack-podcast' ) }
							help={ __(
								'Included in your feed so podcast directories can verify ownership. Most require it for submission.',
								'jetpack-podcast'
							) }
							{ ...emailField }
						/>
					</VStack>
				</CardBody>
			</Card>

			{ draft.podcasting_category_id > 0 && (
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
