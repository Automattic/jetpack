import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Link, Stack, SwitchControl, Text } from '@wordpress/ui';
import { useId } from 'react';
import { PanelModuleToggle } from './panel-module-toggle';
import styles from './styles.module.scss';
import { useModuleOption } from './use-module-option';
import type { ModuleSettingsProps } from './registry';

/**
 * The Markdown options.
 *
 * @param props          - Component props.
 * @param props.module   - The module.
 * @param props.disabled - Whether the site cannot use the module.
 * @return The settings.
 */
export function MarkdownSettings( { module: $module, disabled }: ModuleSettingsProps ) {
	const posts = useModuleOption( $module, 'wpcom_publish_posts_with_markdown' );
	const comments = useModuleOption( $module, 'wpcom_publish_comments_with_markdown' );
	const optionsDisabled = ! $module.activated || disabled;
	const labelId = useId();

	return (
		<Stack direction="column" gap="lg">
			<Text variant="body-md">
				{ __(
					'Use Markdown syntax to compose content with links, lists, and other styles. This setting enables Markdown in the Classic Editor as well as within a Classic Editor block.',
					'jetpack-my-jetpack'
				) }
			</Text>
			<Link
				href={ getRedirectUrl( 'jetpack-support-markdown' ) }
				target="_blank"
				rel="noopener noreferrer"
			>
				{ __( 'Learn more about Markdown', 'jetpack-my-jetpack' ) }
			</Link>

			<Stack
				direction="row"
				align="center"
				justify="space-between"
				className={ styles[ 'settings-panel__toggle' ] }
			>
				<Text variant="body-md" id={ labelId }>
					{ __( 'Enable Markdown', 'jetpack-my-jetpack' ) }
				</Text>
				<PanelModuleToggle module={ $module } labelledby={ labelId } disabled={ disabled } />
			</Stack>

			<SwitchControl
				label={ __( 'Write posts and pages with Markdown', 'jetpack-my-jetpack' ) }
				checked={ posts.value }
				disabled={ optionsDisabled || posts.isSaving }
				onCheckedChange={ posts.setValue }
			/>
			<SwitchControl
				label={ __( 'Let readers use Markdown in comments', 'jetpack-my-jetpack' ) }
				checked={ comments.value }
				disabled={ optionsDisabled || comments.isSaving }
				onCheckedChange={ comments.setValue }
			/>
		</Stack>
	);
}
