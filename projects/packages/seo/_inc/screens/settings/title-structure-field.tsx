/* eslint-disable jsdoc/require-returns, jsdoc/require-param */

/* eslint-disable react/jsx-no-bind */

import { FormTokenField } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge, Card, CollapsibleCard, Stack } from '@wordpress/ui';
import { TOKEN_IDS, TOKEN_LABELS, fromDisplay, toDisplay } from '../../data/title-format-tokens';
import './style.scss';
import type { TitleFormatToken } from '../../data/settings-types';
import type { FC } from 'react';

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
