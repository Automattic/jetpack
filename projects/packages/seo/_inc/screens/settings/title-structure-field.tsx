/* eslint-disable jsdoc/require-returns, jsdoc/require-param */

/* eslint-disable react/jsx-no-bind */

import { TextControl } from '@wordpress/components';
import { useCallback, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { title as titleIcon } from '@wordpress/icons';
import { Button, Card, CollapsibleCard, Notice, Stack, Text } from '@wordpress/ui';
import CardTitleIcon from '../../components/card-title-icon';
import StatusIndicator from '../../components/status-indicator';
import getSite from '../../data/get-site';
import {
	PAGE_TYPES,
	PAGE_TYPE_SUGGESTIONS,
	PAGE_TYPE_TOKENS,
	TOKEN_LABELS,
	buildDefaultPreviewParts,
	buildPreviewParts,
	stringToTokens,
	tokensToString,
} from '../../data/title-format-tokens';
import styles from './title-structure-field.module.scss';
import type { SettingStatus } from '../../components/status-indicator';
import type { TitleFormatToken } from '../../data/settings-types';
import type { FC } from 'react';

const previewLabel = __( 'Preview', 'jetpack-seo' );
// "Placeholder" is avoided deliberately: in this codebase (and in HTML) it
// already means an input's grey hint text, which is a different thing.
const insertLabel = __( 'Insert a title part', 'jetpack-seo' );
const saveLabel = __( 'Save', 'jetpack-seo' );
// Deliberately says "show as empty" rather than "are left out": a custom format is
// concatenated straight through by `Jetpack_SEO_Titles::get_custom_title()`, so an
// empty part leaves the separator around it in place. Only the *default* title
// drops empty parts, because core runs `array_filter()` before joining.
const moduleDescription = __(
	'How your titles appear in search results and browser tabs. Each page type keeps the default until you set a format; parts your site has no value for show as empty.',
	'jetpack-seo'
);
// Shown in the empty input so the blank field reads as "this already has a title"
// rather than "this is unset".
const defaultPlaceholder = __( 'Using the default title', 'jetpack-seo' );

interface RowProps {
	pageTypeId: string;
	label: string;
	tokens: TitleFormatToken[];
	onChange: ( next: TitleFormatToken[] ) => void;
	onSave: () => void;
	canSave: boolean;
	previewOverrides: Partial< Record< string, string > >;
	/** The site's document-title separator, for previewing an untouched page type. */
	titleSeparator: string;
	disabled?: boolean;
}

/**
 * One page type's title-structure editor as a single row (rows are separated by
 * a hairline divider, not boxed): the labelled text input (holding the format as
 * an editable string — bracketed placeholders like `[Site name]` with literal
 * text, including separators like ` | `, typed between), then a labelled row of
 * buttons that insert a placeholder at the caret, and a footer pairing the live
 * preview with this row's own Save button.
 *
 * This mirrors the legacy Jetpack SEO title editor (a text field + insert-token
 * buttons) rather than a token/chip field, so separators and repeated separators
 * round-trip cleanly. A bracketed label not valid for this page type is kept as
 * a literal fragment so the save never carries a token the back-end rejects.
 * Each row saves on its own (the list is long enough to scroll), persisting only
 * this page type.
 */
const TitleStructureRow: FC< RowProps > = ( {
	pageTypeId,
	label,
	tokens,
	onChange,
	onSave,
	canSave,
	previewOverrides,
	titleSeparator,
	disabled,
} ) => {
	const inputRef = useRef< HTMLInputElement | null >( null );
	const value = useMemo( () => tokensToString( tokens ), [ tokens ] );
	const allowed = PAGE_TYPE_TOKENS[ pageTypeId ];
	// An untouched page type still has a title — WordPress composes it — so preview
	// that instead of leaving the row blank under the module's "Complete" status.
	const previewParts = useMemo(
		() =>
			tokens.length > 0
				? buildPreviewParts( tokens, previewOverrides )
				: buildDefaultPreviewParts( pageTypeId, titleSeparator, previewOverrides ),
		[ tokens, previewOverrides, pageTypeId, titleSeparator ]
	);
	// The parts concatenated — the literal title this format produces. Only used to
	// decide whether there is anything to show; the row renders the parts.
	const preview = useMemo(
		() => previewParts.map( part => part.text ).join( '' ),
		[ previewParts ]
	);

	const setFromString = useCallback(
		( next: string ) => onChange( stringToTokens( next, allowed ) ),
		[ onChange, allowed ]
	);

	const insertToken = useCallback(
		( tokenId: string ) => {
			const input = inputRef.current;
			const insert = `[${ TOKEN_LABELS[ tokenId ] }]`;
			// Insert at the caret when we can read it; otherwise append.
			const caret = input ? input.selectionStart ?? value.length : value.length;
			setFromString( value.slice( 0, caret ) + insert + value.slice( caret ) );
			// Restore focus + place the caret after the inserted placeholder.
			const nextCaret = caret + insert.length;
			requestAnimationFrame( () => {
				if ( input ) {
					input.focus();
					input.setSelectionRange( nextCaret, nextCaret );
				}
			} );
		},
		[ value, setFromString ]
	);

	return (
		<Stack direction="column" gap="md" className={ styles.row }>
			<TextControl
				ref={ inputRef }
				label={ label }
				value={ value }
				placeholder={ defaultPlaceholder }
				onChange={ setFromString }
				disabled={ disabled }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>
			<Stack direction="column" gap="xs">
				<Text variant="body-sm" className={ styles.muted }>
					{ insertLabel }
				</Text>
				<Stack direction="row" gap="xs" wrap="wrap">
					{ PAGE_TYPE_SUGGESTIONS[ pageTypeId ].map( tokenId => (
						<Button
							key={ tokenId }
							variant="outline"
							tone="neutral"
							// `small` (24px), not `compact` (32px): against the 40px field these
							// are a secondary affordance and shouldn't compete with it.
							size="small"
							disabled={ disabled }
							onClick={ () => insertToken( tokenId ) }
						>
							{ TOKEN_LABELS[ tokenId ] }
						</Button>
					) ) }
				</Stack>
			</Stack>
			<Stack direction="row" align="flex-start" gap="lg">
				{ /* Shown for a defaulted row too, so every page type demonstrates the
				     title it produces rather than leaving a blank the module's
				     "Complete" status appears to contradict. A custom format always
				     shows its preview even when it evaluates to nothing — that empty
				     result is the honest one, and hiding it would undo the point. */ }
				{ ( tokens.length > 0 || preview ) && (
					<Text variant="body-md" className={ styles.preview }>
						<strong>{ previewLabel }:</strong>{ ' ' }
						{ /* Values render as chips and separators as the plain text they are, so
						     the shape of the title is legible at a glance — a run of words is
						     hard to read as "site name, then a divider, then a tagline".
						     Concatenating what's rendered still gives the exact emitted title:
						     nothing is inserted between the parts, and the separators keep the
						     admin's own spacing (see `.previewSeparator`). Empty values are
						     skipped so a placeholder that resolves to nothing leaves no stray
						     chip — the separators around it still show, which is what the real
						     title does. */ }
						{ previewParts.map( ( part, index ) =>
							part.text === '' ? null : (
								<span
									// Parts are positional and can repeat ("Acme | Acme"), so the
									// index is the only stable identity available here.
									key={ index }
									className={
										part.kind === 'value' ? styles.previewValue : styles.previewSeparator
									}
								>
									{ part.text }
								</span>
							)
						) }
					</Text>
				) }
				<Button className={ styles.save } onClick={ onSave } disabled={ disabled || ! canSave }>
					{ saveLabel }
				</Button>
			</Stack>
		</Stack>
	);
};

interface Props {
	formats: Record< string, TitleFormatToken[] >;
	onChange: ( pageType: string, next: TitleFormatToken[] ) => void;
	/** Persist one page type's format — each row saves independently. */
	onSaveFormat: ( pageType: string ) => void;
	/** Whether a page type has unsaved edits (enables that row's Save button). */
	isFormatDirty: ( pageType: string ) => boolean;
	/** The site's document-title separator, for previewing untouched page types. */
	titleSeparator: string;
	/** Whether Jetpack currently controls title output. */
	editable: boolean;
	disabled?: boolean;
}

/**
 * Title structure editor covering every page type (front page, posts, pages,
 * tags, archives), one row per type (separated by a divider). The back-end
 * stores a format per page type under `advanced_seo_title_formats`; each type
 * accepts its own token
 * subset (see `PAGE_TYPE_TOKENS`). Each row edits local state while typing and
 * saves on its own button — the list is long enough to scroll, so a single
 * section Save would be out of reach from the lower rows.
 */
const TitleStructureField: FC< Props > = ( {
	formats,
	onChange,
	onSaveFormat,
	isFormatDirty,
	titleSeparator,
	editable,
	disabled,
} ) => {
	// A smart default counts as configured — the same rule the Schema module uses.
	// An untouched page type (an empty token list) still produces a title: Jetpack
	// has no default format of its own, it just steps aside and lets WordPress
	// compose the title. So leaving one alone is a good outcome rather than
	// unfinished work, and this module is always complete. Deliberate: reporting
	// "Not started" here read as a criticism of a site that simply has no reason to
	// customize its titles (JETPACK-2051). Each row previews that default, so the
	// status is backed by something visible.
	const titleStatus: SettingStatus = 'complete';

	// Fill the site-wide placeholders in each row's preview with the site's real
	// name and tagline (bootstrapped in `seo.site`) — including when one of them is
	// empty, which previews as empty because that is what the site renders. Omit the
	// overrides entirely when the site data is missing, so an unknown value still
	// falls back to sample text rather than previewing as a gap the site doesn't
	// actually have. Per-page tokens like [Post title] are never overridden; they
	// vary per page and always show their sample.
	const site = getSite();
	const previewOverrides = useMemo(
		() => ( site ? { site_name: site.title, tagline: site.tagline } : {} ),
		[ site ]
	);

	return (
		<CollapsibleCard.Root defaultOpen={ false }>
			<CollapsibleCard.Header render={ <h2 /> }>
				<Stack direction="row" justify="space-between" align="center" gap="sm">
					<Card.Title>
						<CardTitleIcon icon={ titleIcon } title={ __( 'Title structure', 'jetpack-seo' ) } />
					</Card.Title>
					<CollapsibleCard.HeaderDescription>
						<StatusIndicator status={ titleStatus } />
					</CollapsibleCard.HeaderDescription>
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Stack direction="column" gap="lg">
					<Text variant="body-md" render={ <p /> }>
						{ moduleDescription }
					</Text>
					{ ! editable && (
						<Notice.Root intent="warning">
							<Notice.Description>
								{ __(
									'Another SEO plugin is controlling title output. Your saved title structures are shown here but cannot be edited while it is active.',
									'jetpack-seo'
								) }
							</Notice.Description>
						</Notice.Root>
					) }
					{ PAGE_TYPES.map( pt => (
						<TitleStructureRow
							key={ pt.id }
							pageTypeId={ pt.id }
							label={ pt.label }
							tokens={ formats[ pt.id ] ?? [] }
							onChange={ next => onChange( pt.id, next ) }
							onSave={ () => onSaveFormat( pt.id ) }
							canSave={ isFormatDirty( pt.id ) }
							previewOverrides={ previewOverrides }
							titleSeparator={ titleSeparator }
							disabled={ disabled || ! editable }
						/>
					) ) }
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default TitleStructureField;
