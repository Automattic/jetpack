/* eslint-disable jsdoc/require-returns, jsdoc/require-param */

/* eslint-disable react/jsx-no-bind */

import { FormTokenField } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge, Card, CollapsibleCard, Stack } from '@wordpress/ui';
import './style.scss';
import type { TitleFormatToken } from '../../data/settings-types';
import type { FC } from 'react';

/**
 * Canonical tokens supported for the `posts` page type. Mirrors the back-end
 * list in Jetpack_SEO_Titles. Internal id stays snake_case for the REST
 * payload; the UI shows a friendly bracketed label so users can distinguish
 * token chips from literal string fragments (separators like " | ").
 */
const TOKEN_LABELS: Record< string, string > = {
	site_name: __( 'Site name', 'jetpack-seo' ),
	tagline: __( 'Tagline', 'jetpack-seo' ),
	post_title: __( 'Post title', 'jetpack-seo' ),
};

const TOKEN_IDS = Object.keys( TOKEN_LABELS );

// Reverse map — "Site name" → "site_name" — to parse `[Site name]` back into
// the canonical id when the user picks a suggestion or pastes a label.
const LABEL_TO_TOKEN_ID: Record< string, string > = Object.fromEntries(
	TOKEN_IDS.map( id => [ TOKEN_LABELS[ id ], id ] )
);

const toDisplay = ( token: TitleFormatToken ): string =>
	token.type === 'token' && TOKEN_LABELS[ token.value ]
		? `[${ TOKEN_LABELS[ token.value ] }]`
		: token.value;

const fromDisplay = ( display: string ): TitleFormatToken => {
	const match = display.match( /^\[(.+)\]$/ );
	const inner = match?.[ 1 ];
	if ( inner && LABEL_TO_TOKEN_ID[ inner ] ) {
		return { type: 'token', value: LABEL_TO_TOKEN_ID[ inner ] };
	}
	return { type: 'string', value: display };
};

// Pre-resolved so the production minifier can't fold an adjacent
// `cond ? __(A) : __(B)` into `__(cond ? A : B)`, which breaks i18n
// extraction. See feedback_i18n_ternary_minifier_fold.
const customizedLabel = __( 'Customized', 'jetpack-seo' );
const defaultLabel = __( 'Default', 'jetpack-seo' );

interface Props {
	tokens: TitleFormatToken[];
	onChange: ( next: TitleFormatToken[] ) => void;
	disabled?: boolean;
}

/**
 * FormTokenField-powered post-title-structure editor. Tokens display as
 * bracketed pretty labels (e.g. `[Site name]`) while raw string fragments
 * like " | " coexist as distinct chips.
 */
const TitleStructureField: FC< Props > = ( { tokens, onChange, disabled } ) => {
	const displayValues = useMemo( () => tokens.map( toDisplay ), [ tokens ] );
	const displaySuggestions = useMemo(
		() => TOKEN_IDS.map( id => `[${ TOKEN_LABELS[ id ] }]` ),
		[]
	);

	const preview = useMemo(
		() =>
			tokens
				.map( token => {
					if ( token.type === 'string' ) {
						return token.value;
					}
					switch ( token.value ) {
						case 'site_name':
							return __( 'Your site', 'jetpack-seo' );
						case 'tagline':
							return __( 'Your tagline', 'jetpack-seo' );
						case 'post_title':
							return __( 'Hello World', 'jetpack-seo' );
						default:
							return token.value;
					}
				} )
				.join( '' ),
		[ tokens ]
	);

	const hasCustomStructure = tokens.length > 0;

	return (
		<CollapsibleCard.Root defaultOpen={ false }>
			<CollapsibleCard.Header>
				<Stack direction="row" justify="space-between" align="center" gap="sm">
					<Card.Title>{ __( 'Post title structure', 'jetpack-seo' ) }</Card.Title>
					<Badge intent={ hasCustomStructure ? 'stable' : 'draft' }>
						{ hasCustomStructure ? customizedLabel : defaultLabel }
					</Badge>
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<FormTokenField
					label={ __( 'Tokens', 'jetpack-seo' ) }
					value={ displayValues }
					suggestions={ displaySuggestions }
					onChange={ next => onChange( ( next as string[] ).map( fromDisplay ) ) }
					disabled={ disabled }
					__experimentalExpandOnFocus
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
				<div className="jetpack-seo-settings__preview">
					<strong>{ __( 'Preview', 'jetpack-seo' ) }:</strong> { preview }
				</div>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default TitleStructureField;
