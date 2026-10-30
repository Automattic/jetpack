import RadioCard, { RadioCardGrid } from '@automattic/jetpack-components/radio-card';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Field, Fieldset, Link, Radio, RadioGroup, Stack, Text } from '@wordpress/ui';
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

const NONE = 'none';

const NONE_ITEM_RENDER = <Stack gap="sm" align="center" />;

/**
 * The copy for each feature, no sentence split across strings.
 *
 * @param feature - Feature.
 * @return Copy.
 */
function copyFor( feature: Feature ) {
	return {
		legend:
			feature === 'sharing'
				? __(
						'Where should the Sharing Buttons block go on posts and pages?',
						'jetpack-sharing-likes'
					)
				: __( 'Where should the Like block go on posts and pages?', 'jetpack-sharing-likes' ),
		none: __( 'Don’t add it automatically', 'jetpack-sharing-likes' ),
		before: _x( 'Before the content', 'Where the block goes', 'jetpack-sharing-likes' ),
		after: _x( 'After the content', 'Where the block goes', 'jetpack-sharing-likes' ),
		pageTemplate:
			feature === 'sharing'
				? __(
						'Your choice applies to pages too. To place the Sharing Buttons block differently on pages, <link>edit the page template</link>.',
						'jetpack-sharing-likes'
					)
				: __(
						'Your choice applies to pages too. To place the Like block differently on pages, <link>edit the page template</link>.',
						'jetpack-sharing-likes'
					),
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
	const selected: string = offered?.[ 0 ] ?? NONE;
	const saveSetting = useSaveSetting();
	// While a write is pending the stored settings may not be what the server has yet. A feature action
	// counts until settings are read again, so right after "Switch to the … block" the key can still be missing.
	const saving = useIsSaving();

	const handleChange = useCallback(
		( next: unknown ) => {
			saveSetting( key, next === NONE ? [] : [ next as TemplatePlacement ] );
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
		<Field.Root>
			<Fieldset.Root
				className="jetpack-sharing-likes__placements"
				aria-busy={ ! offered }
				render={
					<RadioGroup value={ selected } onValueChange={ handleChange } disabled={ ! offered } />
				}
			>
				<SettingGroup>
					<Fieldset.Legend>{ copy.legend }</Fieldset.Legend>
					<Field.Item render={ NONE_ITEM_RENDER }>
						<Radio value={ NONE } />
						<Field.Label variant="plain">{ copy.none }</Field.Label>
					</Field.Item>
					<RadioCardGrid>
						{ PLACEMENTS.map( placement => (
							<RadioCard
								key={ placement }
								id={ `${ block }-${ placement.replace( '_', '-' ) }` }
								value={ placement }
								title={ placement === 'before_content' ? copy.before : copy.after }
								illustration={ <PlacementIllustration block={ block } placement={ placement } /> }
								previewUrl={
									// The template only has the block once the save has gone through.
									selected === placement && ! saving ? previewUrl : undefined
								}
							/>
						) ) }
					</RadioCardGrid>
					<SettingGroup>
						{ pageTemplateUrl && (
							<Text render={ <p /> }>
								{ createInterpolateElement( copy.pageTemplate, {
									link: <Link href={ pageTemplateUrl } />,
								} ) }
							</Text>
						) }
						<Text render={ <p /> }>
							{ __(
								'Once you’ve saved a template in the Site Editor, move or remove its blocks there: picking a place here won’t move a block that template already has, or bring back one you removed.',
								'jetpack-sharing-likes'
							) }
						</Text>
					</SettingGroup>
				</SettingGroup>
			</Fieldset.Root>
		</Field.Root>
	);
}
