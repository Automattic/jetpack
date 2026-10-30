import RadioCard, { RadioCardGrid } from '@automattic/jetpack-components/radio-card';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Field, Fieldset, Link, Notice, Radio, RadioGroup, Stack, Text } from '@wordpress/ui';
import { useIsSaving, useSettings, useStatus } from '../data/queries';
import { useSaveSetting } from '../data/use-save-setting';
import { PlacementIllustration, type PlacedBlock } from './placement-illustrations';
import { SettingGroup } from './section-card';
import type { Feature, PlacementTemplate, TemplatePlacement } from '../types';
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

const TEMPLATES: PlacementTemplate[] = [ 'single', 'page' ];

const NONE = 'none';

const NONE_ITEM_RENDER = <Stack gap="sm" align="center" />;

/**
 * The copy for each feature, one complete sentence per string.
 *
 * @param feature - Feature.
 * @return Copy.
 */
function copyFor( feature: Feature ) {
	const shared = {
		none: __( 'Don’t add it automatically', 'jetpack-sharing-likes' ),
		before: _x( 'Before the content', 'Where the block goes', 'jetpack-sharing-likes' ),
		after: _x( 'After the content', 'Where the block goes', 'jetpack-sharing-likes' ),
		editTemplate: {
			single: __( 'Edit the post template', 'jetpack-sharing-likes' ),
			page: __( 'Edit the page template', 'jetpack-sharing-likes' ),
		},
	};

	if ( feature === 'sharing' ) {
		return {
			...shared,
			legend: __(
				'Where should the Sharing Buttons block go on posts and pages?',
				'jetpack-sharing-likes'
			),
			managed: {
				both: __(
					'You’ve customized your post and page templates in the Site Editor. Add, move, or remove the Sharing Buttons block there.',
					'jetpack-sharing-likes'
				),
				single: __(
					'You’ve customized your post template in the Site Editor. Add, move, or remove the Sharing Buttons block there.',
					'jetpack-sharing-likes'
				),
				page: __(
					'You’ve customized your page template in the Site Editor. Add, move, or remove the Sharing Buttons block there.',
					'jetpack-sharing-likes'
				),
			},
		};
	}

	return {
		...shared,
		legend: __( 'Where should the Like block go on posts and pages?', 'jetpack-sharing-likes' ),
		managed: {
			both: __(
				'You’ve customized your post and page templates in the Site Editor. Add, move, or remove the Like block there.',
				'jetpack-sharing-likes'
			),
			single: __(
				'You’ve customized your post template in the Site Editor. Add, move, or remove the Like block there.',
				'jetpack-sharing-likes'
			),
			page: __(
				'You’ve customized your page template in the Site Editor. Add, move, or remove the Like block there.',
				'jetpack-sharing-likes'
			),
		},
	};
}

/**
 * Cards that add the feature's block before or after the content of single posts and pages.
 *
 * @param props          - Props.
 * @param props.feature  - Feature.
 * @param props.fallback - Shown where the settings do not offer the placements.
 * @return Cards, a notice linking to the templates once one manages the block, or the fallback.
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
	const urls: Record< PlacementTemplate, string > = {
		single: status?.site_editor_url ?? '',
		page: status?.page_template_editor_url ?? '',
	};
	const linked = TEMPLATES.filter( template => urls[ template ] );
	const managed = linked.filter( template =>
		status?.[ feature ].managed_templates.includes( template )
	);

	// Once a template is saved in the Site Editor, that's where the block is placed: cards here would only mislead.
	if ( managed.length > 0 ) {
		return (
			<SettingGroup>
				<Notice.Root intent="info">
					<Notice.Description>
						{ copy.managed[ managed.length === 1 ? managed[ 0 ] : 'both' ] }
					</Notice.Description>
					<Notice.Actions>
						{ linked.map( template => (
							<Notice.ActionLink key={ template } href={ urls[ template ] }>
								{ copy.editTemplate[ template ] }
							</Notice.ActionLink>
						) ) }
					</Notice.Actions>
				</Notice.Root>
			</SettingGroup>
		);
	}

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
									selected === placement && ! saving ? urls.single : undefined
								}
							/>
						) ) }
					</RadioCardGrid>
					{ urls.page && (
						<Text render={ <p /> }>
							{ createInterpolateElement(
								__(
									'Want pages to look different? <link>Edit the page template</link>.',
									'jetpack-sharing-likes'
								),
								{ link: <Link href={ urls.page } /> }
							) }
						</Text>
					) }
				</SettingGroup>
			</Fieldset.Root>
		</Field.Root>
	);
}
