import apiFetch from '@wordpress/api-fetch';
import { SelectControl } from '@wordpress/components';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, CheckboxControl, Dialog, InputControl, Notice, Stack, Text } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';
import { formatDuration } from '../../utils/format';
import './style.scss';
import type { PlaylistEntry } from '../../types/playlists';

const REST_PATH = '/jetpack/v4/videopress';
const PREVIEW_COUNT = 5;
const PAGE_SIZE = 100;
const SNAPSHOT_LIMIT = 200;
const DEBOUNCE_MS = 300;

type Term = { id: number; name: string; slug: string; parent: number };
type Vocabulary = { taxonomy: string; label: string; terms: Term[] };
type MatchedVideo = {
	guid: string;
	title: string;
	durationMs: number;
	height: number;
	snippet?: string;
	startMs?: number;
};
type VideosResponse = { videos: MatchedVideo[]; total: number; pages: number };
type Length = 'any' | 'short' | 'mid' | 'long';
type Query = { search: string; length: Length; terms: Record< string, string[] > };

/**
 * The `GET /videos` path for a query.
 *
 * @param query   - Search, length and selected terms.
 * @param page    - 1-based page.
 * @param perPage - Page size.
 * @return The REST path.
 */
export const videosPath = ( query: Query, page: number, perPage: number ) =>
	addQueryArgs( `${ REST_PATH }/videos`, {
		search: query.search.trim() || undefined,
		length: query.length,
		page,
		per_page: perPage,
		...Object.fromEntries(
			Object.entries( query.terms ).filter( ( [ , slugs ] ) => slugs.length > 0 )
		),
	} );

type Props = {
	onAdd: ( entries: PlaylistEntry[] ) => void;
	onClose: () => void;
};

/**
 * Add every video matching a search and classification to a playlist, once. The playlist keeps
 * the videos it got: later uploads or reclassification never change it.
 *
 * @param props         - Component props.
 * @param props.onAdd   - Receives the matching entries, in channel order.
 * @param props.onClose - Closes the dialog.
 * @return The dialog element.
 */
export default function AddMatchingDialog( { onAdd, onClose }: Props ) {
	const [ vocabularies, setVocabularies ] = useState< Vocabulary[] >( [] );
	const [ query, setQuery ] = useState< Query >( { search: '', length: 'any', terms: {} } );
	const [ preview, setPreview ] = useState< VideosResponse | null >( null );
	const [ isAdding, setIsAdding ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	useEffect( () => {
		apiFetch< Vocabulary[] >( { path: `${ REST_PATH }/classification` } )
			.then( setVocabularies )
			.catch( () => setVocabularies( [] ) );
	}, [] );

	const hasFilter = useMemo(
		() =>
			query.search.trim() !== '' ||
			query.length !== 'any' ||
			Object.values( query.terms ).some( slugs => slugs.length > 0 ),
		[ query ]
	);

	useEffect( () => {
		if ( ! hasFilter ) {
			setPreview( null );
			return;
		}
		let stale = false;
		const timer = setTimeout( () => {
			apiFetch< VideosResponse >( { path: videosPath( query, 1, PREVIEW_COUNT ) } )
				.then( response => ! stale && setPreview( response ) )
				.catch(
					() =>
						! stale && setError( __( 'Could not load matching videos.', 'jetpack-videopress-pkg' ) )
				);
		}, DEBOUNCE_MS );
		return () => {
			stale = true;
			clearTimeout( timer );
		};
	}, [ query, hasFilter ] );

	const toggleTerm = ( taxonomy: string, slug: string, checked: boolean ) =>
		setQuery( current => {
			const selected = new Set( current.terms[ taxonomy ] ?? [] );
			if ( checked ) {
				selected.add( slug );
			} else {
				selected.delete( slug );
			}
			return { ...current, terms: { ...current.terms, [ taxonomy ]: [ ...selected ] } };
		} );

	const addAll = async () => {
		setIsAdding( true );
		setError( null );
		try {
			const entries: PlaylistEntry[] = [];
			for ( let page = 1; entries.length < SNAPSHOT_LIMIT; page++ ) {
				const response = await apiFetch< VideosResponse >( {
					path: videosPath( query, page, PAGE_SIZE ),
				} );
				response.videos.forEach( video =>
					entries.push( { guid: video.guid, durationMs: video.durationMs, height: video.height } )
				);
				if ( page >= response.pages ) {
					break;
				}
			}
			onAdd( entries.slice( 0, SNAPSHOT_LIMIT ) );
		} catch {
			setError( __( 'Could not add the matching videos.', 'jetpack-videopress-pkg' ) );
			setIsAdding( false );
		}
	};

	const total = preview?.total ?? 0;
	const adding = Math.min( total, SNAPSHOT_LIMIT );
	const addLabel = sprintf(
		/* translators: %d: number of matching videos. */
		_n( 'Add %d matching video', 'Add %d matching videos', adding, 'jetpack-videopress-pkg' ),
		adding
	);

	return (
		<Dialog.Root
			open
			onOpenChange={ open => {
				if ( ! open ) {
					onClose();
				}
			} }
		>
			<Dialog.Popup size="large" className="vp-playlist-matching">
				<Dialog.Header>
					<Dialog.Title>{ __( 'Add matching videos', 'jetpack-videopress-pkg' ) }</Dialog.Title>
					<Dialog.CloseIconButton label={ __( 'Close', 'jetpack-videopress-pkg' ) } />
				</Dialog.Header>
				<Dialog.Content>
					<Stack direction="column" gap="lg">
						<Text variant="body-sm" className="vp-playlist-matching__help">
							{ __(
								'Videos are added once, in channel order. Later uploads or classification changes do not change this playlist.',
								'jetpack-videopress-pkg'
							) }
						</Text>
						<div className="vp-playlist-matching__query">
							<InputControl
								label={ __( 'Title, description or spoken words', 'jetpack-videopress-pkg' ) }
								value={ query.search }
								onValueChange={ search => setQuery( current => ( { ...current, search } ) ) }
							/>
							<SelectControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'Length', 'jetpack-videopress-pkg' ) }
								value={ query.length }
								options={ [
									{ value: 'any', label: __( 'Any length', 'jetpack-videopress-pkg' ) },
									{ value: 'short', label: __( 'Under 20 min', 'jetpack-videopress-pkg' ) },
									{ value: 'mid', label: __( '20 to 45 min', 'jetpack-videopress-pkg' ) },
									{ value: 'long', label: __( 'Over 45 min', 'jetpack-videopress-pkg' ) },
								] }
								onChange={ ( length: Length ) => setQuery( current => ( { ...current, length } ) ) }
							/>
						</div>
						<div className="vp-playlist-matching__vocabularies">
							{ vocabularies
								.filter( vocabulary => vocabulary.terms.length > 0 )
								.map( vocabulary => (
									<fieldset
										key={ vocabulary.taxonomy }
										className="vp-playlist-matching__vocabulary"
									>
										<legend>{ vocabulary.label }</legend>
										{ vocabulary.terms.map( term => (
											<CheckboxControl
												key={ term.id }
												label={ term.name }
												checked={ ( query.terms[ vocabulary.taxonomy ] ?? [] ).includes(
													term.slug
												) }
												onCheckedChange={ ( checked: boolean ) =>
													toggleTerm( vocabulary.taxonomy, term.slug, checked )
												}
											/>
										) ) }
									</fieldset>
								) ) }
						</div>
						{ error && (
							<Notice.Root intent="error">
								<Notice.Description>{ error }</Notice.Description>
							</Notice.Root>
						) }
						{ preview && (
							<div className="vp-playlist-matching__preview">
								<Text variant="body-sm" className="vp-playlist-matching__count">
									{ total > SNAPSHOT_LIMIT
										? sprintf(
												/* translators: 1: number of matching videos, 2: how many are added at most. */
												__(
													'%1$d videos match; the first %2$d are added.',
													'jetpack-videopress-pkg'
												),
												total,
												SNAPSHOT_LIMIT
											)
										: sprintf(
												/* translators: %d: number of matching videos. */
												_n(
													'%d video matches.',
													'%d videos match.',
													total,
													'jetpack-videopress-pkg'
												),
												total
											) }
								</Text>
								<ol>
									{ preview.videos.map( video => (
										<li key={ video.guid }>
											<span className="vp-playlist-matching__title">
												{ video.title || video.guid }
											</span>
											<span className="vp-playlist-matching__meta">
												{ video.durationMs ? formatDuration( video.durationMs / 1000 ) : '' }
											</span>
											{ video.snippet && (
												<span className="vp-playlist-matching__snippet">
													{ formatDuration( ( video.startMs ?? 0 ) / 1000 ) } “{ video.snippet }”
												</span>
											) }
										</li>
									) ) }
								</ol>
							</div>
						) }
						<Stack direction="row" gap="sm" justify="flex-end">
							<Button variant="outline" onClick={ onClose }>
								{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
							</Button>
							<Button
								disabled={ ! hasFilter || total === 0 || isAdding }
								loading={ isAdding }
								onClick={ () => void addAll() }
							>
								{ hasFilter && total > 0
									? addLabel
									: __( 'Add matching videos', 'jetpack-videopress-pkg' ) }
							</Button>
						</Stack>
					</Stack>
				</Dialog.Content>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
