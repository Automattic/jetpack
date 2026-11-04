import { getRedirectUrl } from '@automattic/jetpack-components';
import { getScriptData } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { Link, Notice, RadioGroupControl, Stack, Text } from '@wordpress/ui';
import { useCallback, useId } from 'react';
import { ModuleToggle } from '../module-toggle';
import styles from './styles.module.scss';
import { useModuleSetting } from './use-module-option';
import type { ModuleSettingsProps } from './registry';

// Printed by the Jetpack plugin, which knows the themes it ships Infinite Scroll support for.
type JetpackPluginScriptData = { jetpack?: { themeSupports?: { infiniteScroll?: boolean } } };

// The option defaults to on, so a missing value means scroll.
const toScroll = ( stored: unknown ) => stored === undefined || Boolean( stored );

/**
 * The Infinite Scroll options.
 *
 * @param props          - Component props.
 * @param props.module   - The module.
 * @param props.disabled - Whether the site cannot use the module.
 * @return The settings.
 */
export function InfiniteScrollSettings( { module: $module, disabled }: ModuleSettingsProps ) {
	const scroll = useModuleSetting( $module, 'infinite_scroll', toScroll );
	const labelId = useId();
	const themeSupported =
		( getScriptData() as JetpackPluginScriptData | undefined )?.jetpack?.themeSupports
			?.infiniteScroll === true;

	const { setValue: setScroll } = scroll;
	const onModeChange = useCallback(
		( value: unknown ) => setScroll( value === 'scroll' ),
		[ setScroll ]
	);

	return (
		<Stack direction="column" gap="lg">
			{ ! themeSupported && (
				<Notice.Root intent="info">
					<Notice.Description>
						{ __( 'Your theme needs to support Infinite Scroll.', 'jetpack-my-jetpack' ) }{ ' ' }
						<Link
							href={ getRedirectUrl( 'jetpack-support-infinite-scroll', { anchor: 'theme' } ) }
							target="_blank"
							rel="noopener noreferrer"
						>
							{ __( 'Learn how to add support', 'jetpack-my-jetpack' ) }
						</Link>
					</Notice.Description>
				</Notice.Root>
			) }
			<Text variant="body-md">
				{ __(
					'Create a smooth, uninterrupted reading experience by loading more content as visitors scroll to the bottom of your archive pages.',
					'jetpack-my-jetpack'
				) }
			</Text>
			<Link
				href={ getRedirectUrl( 'jetpack-support-infinite-scroll' ) }
				target="_blank"
				rel="noopener noreferrer"
			>
				{ __( 'Learn more about Infinite Scroll', 'jetpack-my-jetpack' ) }
			</Link>

			<Stack
				direction="row"
				align="center"
				justify="space-between"
				className={ styles[ 'settings-panel__toggle' ] }
			>
				<Text variant="body-md" id={ labelId }>
					{ __( 'Load more posts without leaving the page', 'jetpack-my-jetpack' ) }
				</Text>
				<ModuleToggle
					module={ $module }
					labelledby={ labelId }
					// Without theme support, turning it on does nothing, but an active module can still go off.
					disabled={ disabled || ( ! themeSupported && ! $module.activated ) }
				/>
			</Stack>

			{ themeSupported && (
				<RadioGroupControl
					label={ __( 'How more posts load', 'jetpack-my-jetpack' ) }
					items={ [
						{
							value: 'button',
							label: __( 'Load more posts in page with a button', 'jetpack-my-jetpack' ),
						},
						{
							value: 'scroll',
							label: __( 'Load more posts as the reader scrolls down', 'jetpack-my-jetpack' ),
						},
					] }
					value={ scroll.value ? 'scroll' : 'button' }
					onValueChange={ onModeChange }
					disabled={ ! $module.activated || disabled || scroll.isSaving }
				/>
			) }
		</Stack>
	);
}
