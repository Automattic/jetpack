/* @jsxImportSource react */
import { DataForm, type Field } from '@wordpress/dataviews';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SectionCard, ToggleEdit, overrideNote } from '../components';
import type { FeatureModule, ModuleOverrides, Settings } from '../types';
import type { SaveSettings } from '../use-settings';
import type { JSX } from 'react';

/**
 * Comment features that work with any form, each its own Jetpack module.
 *
 * @param props           - Props.
 * @param props.settings  - Settings.
 * @param props.save      - Save function.
 * @param props.modules   - The feature modules this site has.
 * @param props.overrides - Modules a filter forces on or off.
 * @return Section, or null when the site has none of them.
 */
export function FeaturesSection( {
	settings,
	save,
	modules,
	overrides,
}: {
	settings: Settings;
	save: SaveSettings;
	modules: FeatureModule[];
	overrides: ModuleOverrides;
} ): JSX.Element | null {
	const onChange = useCallback(
		( edits: Partial< Settings > ) => {
			// Markdown in comments needs the Markdown module, which also owns Markdown in posts, so only ever turn it on.
			if ( edits.wpcom_publish_comments_with_markdown && ! settings.markdown ) {
				return save( { ...edits, markdown: true } );
			}
			return save( edits );
		},
		[ save, settings.markdown ]
	);

	const fields: ( Field< Settings > & { module: FeatureModule } )[] = [
		{
			module: 'gravatar-hovercards' as FeatureModule,
			id: 'gravatar-hovercards',
			label: __( 'Show Gravatar profile cards', 'jetpack-comments' ),
			description: __(
				'Readers see a commenter’s Gravatar profile when they hover over their avatar.',
				'jetpack-comments'
			),
			type: 'boolean' as const,
			Edit: ToggleEdit,
		},
		{
			module: 'markdown' as FeatureModule,
			id: 'wpcom_publish_comments_with_markdown',
			label: __( 'Allow Markdown in comments', 'jetpack-comments' ),
			description: __( 'Readers can format comments with Markdown.', 'jetpack-comments' ),
			type: 'boolean' as const,
			getValue: ( { item } ) => item.markdown && item.wpcom_publish_comments_with_markdown,
			Edit: ToggleEdit,
		},
		{
			module: 'comment-likes' as FeatureModule,
			id: 'comment-likes',
			label: __( 'Let readers like comments', 'jetpack-comments' ),
			description: __( 'Adds a Like button to each comment.', 'jetpack-comments' ),
			type: 'boolean' as const,
			Edit: ToggleEdit,
		},
	]
		.filter( field => modules.includes( field.module ) )
		.map( field => {
			// Markdown in comments is its own option, so only a module forced off locks it.
			const override = overrides[ field.module ];
			const locked = field.module === 'markdown' ? override === 'inactive' : !! override;
			return locked ? { ...field, isDisabled: true, description: overrideNote( override ) } : field;
		} );

	if ( ! fields.length ) {
		return null;
	}

	return (
		<SectionCard
			title={ __( 'More comment features', 'jetpack-comments' ) }
			description={ __( 'These work with any comment form.', 'jetpack-comments' ) }
		>
			<DataForm< Settings >
				data={ settings }
				fields={ fields }
				form={ {
					layout: { type: 'regular', labelPosition: 'top' },
					fields: fields.map( field => field.id ),
				} }
				onChange={ onChange }
			/>
		</SectionCard>
	);
}
