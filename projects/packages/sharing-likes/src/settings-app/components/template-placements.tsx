import CheckboxCard, { CheckboxCardGrid } from '@automattic/jetpack-components/checkbox-card';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Fieldset, Link, Text } from '@wordpress/ui';
import { useIsSaving, useSettings, useStatus } from '../data/queries';
import { useSaveSetting } from '../data/use-save-setting';
import { PlacementIllustration, type PlacedBlock } from './placement-illustrations';
import { SettingGroup } from './section-card';
import type { Feature, TemplatePlacement } from '../types';
import type { JSX, ReactNode } from 'react';

const SETTING_KEYS = {
	sharing: 'sharing_buttons_auto_add',
	likes: 'likes_auto_add',
} as const;

const PLACED_BLOCKS: Record< Feature, PlacedBlock > = {
	sharing: 'sharing-buttons',
	likes: 'like',
};

const PLACEMENTS: TemplatePlacement[] = [ 'before_content', 'after_content' ];

/**
 * The copy for each feature, one complete sentence per string.
 *
 * @param feature - Feature.
 * @return Copy.
 */
function copyFor( feature: Feature ) {
	return {
		legend:
			feature === 'sharing'
				? __( 'Add the Sharing Buttons block to posts and pages', 'jetpack-sharing-likes' )
				: __( 'Add the Like block to posts and pages', 'jetpack-sharing-likes' ),
		before: _x( 'Before the content', 'Where the block goes', 'jetpack-sharing-likes' ),
		after: _x( 'After the content', 'Where the block goes', 'jetpack-sharing-likes' ),
	};
}

/**
 * Cards that add the feature's block before or after the content of single posts and pages.
 *
 * @param props          - Props.
 * @param props.feature  - Feature.
 * @param props.fallback - Shown where the settings do not offer the placements.
 * @return Cards, or the fallback.
 */
export function TemplatePlacements( {
	feature,
	fallback,
}: {
	feature: Feature;
	fallback: ReactNode;
} ): JSX.Element {
	const status = useStatus();
	const key = SETTING_KEYS[ feature ];
	const offered = useSettings()?.[ key ];
	const selected = offered ?? [];
	const saveSetting = useSaveSetting();
	// While a write is pending the stored settings may not be what the server has yet. A feature action
	// counts until settings are read again, so right after "Switch to the … block" the key can still be missing.
	const saving = useIsSaving();

	const handleChange = useCallback(
		( name: string, next: boolean ) => {
			// The block goes on one side only, so ticking a card replaces the other.
			saveSetting( key, next ? [ name as TemplatePlacement ] : [] );
		},
		[ key, saveSetting ]
	);

	if ( ! offered && ! saving ) {
		return <>{ fallback }</>;
	}

	const copy = copyFor( feature );
	const block = PLACED_BLOCKS[ feature ];
	const previewUrl = status?.site_editor_url ?? '';
	const pageTemplateUrl = status?.page_template_editor_url ?? '';

	return (
		<Fieldset.Root className="jetpack-sharing-likes__placements" aria-busy={ ! offered }>
			<SettingGroup>
				<Fieldset.Legend>{ copy.legend }</Fieldset.Legend>
				<Fieldset.Description>
					{ __( 'Pick one place: before or after the content.', 'jetpack-sharing-likes' ) }
				</Fieldset.Description>
				<CheckboxCardGrid>
					{ PLACEMENTS.map( placement => (
						<CheckboxCard
							key={ placement }
							id={ `${ block }-${ placement.replace( '_', '-' ) }` }
							name={ placement }
							title={ placement === 'before_content' ? copy.before : copy.after }
							illustration={ <PlacementIllustration block={ block } placement={ placement } /> }
							checked={ selected.includes( placement ) }
							onChange={ handleChange }
							previewUrl={
								// The template only has the block once the save has gone through.
								selected.includes( placement ) && ! saving ? previewUrl : undefined
							}
							disabled={ ! offered }
						/>
					) ) }
				</CheckboxCardGrid>
				{ /* Not Fieldset.Details: the fieldset takes one description, and it would replace the hint above. */ }
				<SettingGroup>
					{ pageTemplateUrl && (
						<Text render={ <p /> }>
							{ createInterpolateElement(
								__(
									'Want pages to look different? <link>Edit the page template</link>.',
									'jetpack-sharing-likes'
								),
								{ link: <Link href={ pageTemplateUrl } /> }
							) }
						</Text>
					) }
					<Text render={ <p /> }>
						{ __(
							'Templates you’ve saved in the Site Editor keep the blocks you left in them, whatever you pick here.',
							'jetpack-sharing-likes'
						) }
					</Text>
				</SettingGroup>
			</SettingGroup>
		</Fieldset.Root>
	);
}
