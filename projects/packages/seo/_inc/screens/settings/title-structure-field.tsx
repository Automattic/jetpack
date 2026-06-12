/* eslint-disable jsdoc/require-returns, jsdoc/require-param */

/* eslint-disable react/jsx-no-bind */

import { FormTokenField } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Badge, Card, CollapsibleCard, Stack } from '@wordpress/ui';
import {
	PAGE_TYPES,
	PAGE_TYPE_SUGGESTIONS,
	PAGE_TYPE_TOKENS,
	TOKEN_LABELS,
	buildPreview,
	fromDisplay,
	toDisplay,
} from '../../data/title-format-tokens';
import './style.scss';
import type { TitleFormatToken } from '../../data/settings-types';
import type { FC } from 'react';

// Pre-resolved so the production minifier can't fold an adjacent
// `cond ? __(A) : __(B)` into `__(cond ? A : B)`, which breaks i18n
// extraction. See feedback_i18n_ternary_minifier_fold.
const defaultLabel = __( 'Default', 'jetpack-seo' );
const previewLabel = __( 'Preview', 'jetpack-seo' );

interface RowProps {
	pageTypeId: string;
	label: string;
	tokens: TitleFormatToken[];
	onChange: ( next: TitleFormatToken[] ) => void;
	disabled?: boolean;
}

/**
 * One page type's title-structure editor: a FormTokenField scoped to the tokens
 * that page type allows, plus a live preview. Tokens display as bracketed pretty
 * labels (e.g. `[Site name]`) while raw string fragments like " | " coexist as
 * distinct chips. A bracketed label that isn't valid for this page type is kept
 * as a literal fragment so the save never carries a token the back-end rejects.
 */
const TitleStructureRow: FC< RowProps > = ( { pageTypeId, label, tokens, onChange, disabled } ) => {
	const displayValues = useMemo( () => tokens.map( toDisplay ), [ tokens ] );
	const suggestions = useMemo(
		() => PAGE_TYPE_SUGGESTIONS[ pageTypeId ].map( id => `[${ TOKEN_LABELS[ id ] }]` ),
		[ pageTypeId ]
	);
	const allowed = PAGE_TYPE_TOKENS[ pageTypeId ];
	const preview = useMemo( () => buildPreview( tokens ), [ tokens ] );

	return (
		<div className="jetpack-seo-settings__title-row">
			<FormTokenField
				label={ label }
				value={ displayValues }
				suggestions={ suggestions }
				onChange={ next =>
					onChange( ( next as string[] ).map( display => fromDisplay( display, allowed ) ) )
				}
				disabled={ disabled }
				__experimentalExpandOnFocus
				__next40pxDefaultSize
				__nextHasNoMarginBottom
			/>
			{ tokens.length > 0 && (
				<div className="jetpack-seo-settings__preview">
					<strong>{ previewLabel }:</strong> { preview }
				</div>
			) }
		</div>
	);
};

interface Props {
	formats: Record< string, TitleFormatToken[] >;
	onChange: ( pageType: string, next: TitleFormatToken[] ) => void;
	disabled?: boolean;
}

/**
 * Title structure editor covering every page type (front page, posts, pages,
 * tags, archives), one FormTokenField per type. The back-end stores a format
 * per page type under `advanced_seo_title_formats`; each type accepts its own
 * token subset (see `PAGE_TYPE_TOKENS`).
 */
const TitleStructureField: FC< Props > = ( { formats, onChange, disabled } ) => {
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
							disabled={ disabled }
						/>
					) ) }
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default TitleStructureField;
