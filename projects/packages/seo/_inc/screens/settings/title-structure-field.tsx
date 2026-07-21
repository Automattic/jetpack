/* eslint-disable jsdoc/require-returns, jsdoc/require-param */

/* eslint-disable react/jsx-no-bind */

import { TextControl } from '@wordpress/components';
import { useCallback, useMemo, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Badge, Button, Card, CollapsibleCard, Stack } from '@wordpress/ui';
import {
	PAGE_TYPES,
	PAGE_TYPE_SUGGESTIONS,
	PAGE_TYPE_TOKENS,
	TOKEN_LABELS,
	buildPreview,
	stringToTokens,
	tokensToString,
} from '../../data/title-format-tokens';
import './style.scss';
import type { TitleFormatToken } from '../../data/settings-types';
import type { FC } from 'react';

// Pre-resolved so the production minifier can't fold an adjacent
// `cond ? __(A) : __(B)` into `__(cond ? A : B)`, which breaks i18n
// extraction. See feedback_i18n_ternary_minifier_fold.
const defaultLabel = __( 'Default', 'jetpack-seo' );
const previewLabel = __( 'Preview', 'jetpack-seo' );
const insertLabel = __( 'Insert placeholder', 'jetpack-seo' );
const saveLabel = __( 'Save', 'jetpack-seo' );

interface RowProps {
	pageTypeId: string;
	label: string;
	tokens: TitleFormatToken[];
	onChange: ( next: TitleFormatToken[] ) => void;
	onSave: () => void;
	canSave: boolean;
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
	disabled,
} ) => {
	const inputRef = useRef< HTMLInputElement | null >( null );
	const value = useMemo( () => tokensToString( tokens ), [ tokens ] );
	const allowed = PAGE_TYPE_TOKENS[ pageTypeId ];
	const preview = useMemo( () => buildPreview( tokens ), [ tokens ] );

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
		<div className="jetpack-seo-settings__title-row">
			<TextControl
				ref={ inputRef }
				label={ label }
				value={ value }
				onChange={ setFromString }
				disabled={ disabled }
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>
			<div className="jetpack-seo-settings__title-tokens">
				<span className="jetpack-seo-settings__title-tokens-label">{ insertLabel }</span>
				<Stack direction="row" gap="xs" wrap="wrap">
					{ PAGE_TYPE_SUGGESTIONS[ pageTypeId ].map( tokenId => (
						<Button
							key={ tokenId }
							variant="outline"
							tone="neutral"
							size="compact"
							disabled={ disabled }
							onClick={ () => insertToken( tokenId ) }
						>
							{ TOKEN_LABELS[ tokenId ] }
						</Button>
					) ) }
				</Stack>
			</div>
			<div className="jetpack-seo-settings__title-footer">
				{ tokens.length > 0 && (
					<div className="jetpack-seo-settings__preview">
						<strong>{ previewLabel }:</strong> { preview }
					</div>
				) }
				<div className="jetpack-seo-settings__save">
					<Button onClick={ onSave } disabled={ disabled || ! canSave }>
						{ saveLabel }
					</Button>
				</div>
			</div>
		</div>
	);
};

interface Props {
	formats: Record< string, TitleFormatToken[] >;
	onChange: ( pageType: string, next: TitleFormatToken[] ) => void;
	/** Persist one page type's format — each row saves independently. */
	onSaveFormat: ( pageType: string ) => void;
	/** Whether a page type has unsaved edits (enables that row's Save button). */
	isFormatDirty: ( pageType: string ) => boolean;
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
	disabled,
} ) => {
	const customizedCount = PAGE_TYPES.filter( pt => ( formats[ pt.id ]?.length ?? 0 ) > 0 ).length;

	return (
		<CollapsibleCard.Root defaultOpen={ false }>
			<CollapsibleCard.Header>
				<Stack direction="row" justify="space-between" align="center" gap="sm">
					<Card.Title>{ __( 'Title structure', 'jetpack-seo' ) }</Card.Title>
					<Badge intent={ customizedCount > 0 ? 'stable' : 'draft' }>
						{ customizedCount > 0
							? sprintf(
									/* translators: %1$d: number of customized page types, %2$d: total page types. */
									__( '%1$d of %2$d customized', 'jetpack-seo' ),
									customizedCount,
									PAGE_TYPES.length
							  )
							: defaultLabel }
					</Badge>
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Stack direction="column" gap="lg">
					{ PAGE_TYPES.map( pt => (
						<TitleStructureRow
							key={ pt.id }
							pageTypeId={ pt.id }
							label={ pt.label }
							tokens={ formats[ pt.id ] ?? [] }
							onChange={ next => onChange( pt.id, next ) }
							onSave={ () => onSaveFormat( pt.id ) }
							canSave={ isFormatDirty( pt.id ) }
							disabled={ disabled }
						/>
					) ) }
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default TitleStructureField;
