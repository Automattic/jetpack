import { __ } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
import { useId } from 'react';
import { ModuleToggle } from '../module-toggle';
import styles from './styles.module.scss';
import { useSettingsPanelTracking } from './use-settings-panel-tracking';
import type { ModuleSettingsProps } from './registry';

/**
 * What the panel shows for a module with no settings of its own yet: the switch and the old Settings link.
 *
 * @param props          - Component props.
 * @param props.module   - The module.
 * @param props.disabled - Whether the site cannot use the module.
 * @return The fallback content.
 */
export function FallbackSettings( { module: $module, disabled }: ModuleSettingsProps ) {
	const labelId = useId();
	const { trackModuleToggle } = useSettingsPanelTracking( $module.module );

	return (
		<Stack direction="column" gap="lg">
			{ $module.description && <Text variant="body-md">{ $module.description }</Text> }

			<Stack
				direction="row"
				align="center"
				justify="space-between"
				className={ styles[ 'settings-panel__toggle' ] }
			>
				<Text variant="body-md" id={ labelId }>
					{ __( 'Activate this feature', 'jetpack-my-jetpack' ) }
				</Text>
				<ModuleToggle
					module={ $module }
					labelledby={ labelId }
					disabled={ disabled }
					onSwitch={ trackModuleToggle }
				/>
			</Stack>

			{ $module.configure_url && (
				<Link href={ $module.configure_url }>
					{ __( 'Manage in Settings', 'jetpack-my-jetpack' ) }
				</Link>
			) }
		</Stack>
	);
}
