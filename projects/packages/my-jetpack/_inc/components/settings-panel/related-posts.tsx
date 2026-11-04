import { getRedirectUrl } from '@automattic/jetpack-components';
import { getAdminUrl, getScriptData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, Stack, SwitchControl, Text } from '@wordpress/ui';
import { useEffect, useId, useState } from 'react';
import { ModuleToggle } from '../module-toggle';
import { RelatedPostsPreview } from './related-posts-preview';
import styles from './styles.module.scss';
import { useModuleOption } from './use-module-option';
import type { ModuleSettingsProps } from './registry';

const SUPPORT_URL = getRedirectUrl( 'jetpack-support-related-posts' );

/**
 * Where to adjust how related posts look: the site editor docs on a block theme, the Customizer otherwise.
 *
 * @return The link.
 */
function AppearanceLink() {
	if ( getScriptData()?.myJetpack?.siteEditor?.isBlockTheme ) {
		return (
			<Link
				href={ getRedirectUrl( 'jetpack-support-related-posts', {
					anchor: 'adding-related-posts-block-theme',
				} ) }
				target="_blank"
				rel="noopener noreferrer"
			>
				{ __(
					'Add a Related Posts Block to your site’s template in the site editor',
					'jetpack-my-jetpack'
				) }
			</Link>
		);
	}

	return <CustomizerLink />;
}

/**
 * The Customizer section, previewing the latest post: its controls show only on a single post.
 *
 * @return The link.
 */
function CustomizerLink() {
	const [ postUrl, setPostUrl ] = useState< string >();

	useEffect( () => {
		let current = true;
		apiFetch< { link: string }[] >( { path: '/wp/v2/posts?per_page=1&_fields=link' } )
			.then( posts => current && setPostUrl( posts[ 0 ]?.link ) )
			.catch( () => undefined );
		return () => {
			current = false;
		};
	}, [] );

	const customizer = new URL( getAdminUrl( 'customize.php' ) );
	customizer.searchParams.set( 'autofocus[section]', 'jetpack_relatedposts' );
	customizer.searchParams.set( 'return', window.location.href );
	if ( postUrl ) {
		customizer.searchParams.set( 'url', postUrl );
	}

	return (
		<Link href={ customizer.href }>
			{ __( 'Configure related posts in the Customizer', 'jetpack-my-jetpack' ) }
		</Link>
	);
}

/**
 * The Related Posts options.
 *
 * @param props          - Component props.
 * @param props.module   - The module.
 * @param props.disabled - Whether the site cannot use the module.
 * @return The settings.
 */
export function RelatedPostsSettings( { module: $module, disabled }: ModuleSettingsProps ) {
	const headline = useModuleOption( $module, 'show_headline' );
	const thumbnails = useModuleOption( $module, 'show_thumbnails' );
	const optionsDisabled = ! $module.activated || disabled;
	const labelId = useId();

	return (
		<Stack direction="column" gap="lg">
			<Text variant="body-md">
				{ createInterpolateElement(
					__(
						'Keep your visitors engaged with related content at the bottom of each post. These settings won’t apply to <a>related posts added using the block editor</a>.',
						'jetpack-my-jetpack'
					),
					{ a: <Link href={ SUPPORT_URL } target="_blank" rel="noopener noreferrer" /> }
				) }
			</Text>

			<Stack
				direction="row"
				align="center"
				justify="space-between"
				className={ styles[ 'settings-panel__toggle' ] }
			>
				<Text variant="body-md" id={ labelId }>
					{ __( 'Show related content after posts', 'jetpack-my-jetpack' ) }
				</Text>
				<ModuleToggle module={ $module } labelledby={ labelId } disabled={ disabled } />
			</Stack>

			<SwitchControl
				label={ __( 'Highlight related content with a heading', 'jetpack-my-jetpack' ) }
				checked={ headline.value }
				disabled={ optionsDisabled || headline.isSaving }
				onCheckedChange={ headline.setValue }
			/>
			<SwitchControl
				label={ __( 'Show a thumbnail image where available', 'jetpack-my-jetpack' ) }
				checked={ thumbnails.value }
				disabled={ optionsDisabled || thumbnails.isSaving }
				onCheckedChange={ thumbnails.setValue }
			/>

			{ $module.activated && (
				<RelatedPostsPreview showHeadline={ headline.value } showThumbnails={ thumbnails.value } />
			) }

			{ $module.activated && ! disabled && <AppearanceLink /> }
		</Stack>
	);
}
