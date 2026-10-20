import CheckboxCard, { CheckboxCardGrid } from '@automattic/jetpack-components/checkbox-card';
import { useIsFetching, useIsMutating, useMutationState } from '@tanstack/react-query';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Fieldset, Link, Text } from '@wordpress/ui';
import { SAVE_SETTING_KEY, WRITES_KEY, queryKeys, useSettings, useStatus } from '../data/queries';
import { useSaveSetting, type SettingChange } from '../data/use-save-setting';
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
 * The placements of the last save that went through, which the optimistic cache value hides while saves are pending.
 *
 * @param key     - Setting.
 * @param current - Cached value.
 * @return Saved placements.
 */
function useSavedPlacements(
	key: ( typeof SETTING_KEYS )[ Feature ],
	current: TemplatePlacement[]
): TemplatePlacement[] {
	// Saves run one at a time, so the oldest pending one still holds what the server has.
	const oldestPending = useMutationState( {
		filters: { mutationKey: SAVE_SETTING_KEY, status: 'pending' },
		select: mutation => mutation.state.variables as SettingChange | undefined,
	} ).find( change => change?.key === key );

	return oldestPending
		? ( ( oldestPending.previous as TemplatePlacement[] | undefined ) ?? [] )
		: current;
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
	const saved = useSavedPlacements( key, selected );
	const saveSetting = useSaveSetting();
	// "Switch to the … block" lands in this variant before settings are read again, so the key is still missing.
	const settling =
		useIsMutating( { mutationKey: WRITES_KEY } ) +
			useIsFetching( { queryKey: queryKeys.settings } ) >
		0;

	const handleChange = useCallback(
		( name: string, next: boolean ) => {
			// The block goes on one side only, so ticking a card replaces the other.
			saveSetting( key, next ? [ name as TemplatePlacement ] : [] );
		},
		[ key, saveSetting ]
	);

	if ( ! offered && ! settling ) {
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
								selected.includes( placement ) && saved.includes( placement )
									? previewUrl
									: undefined
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
