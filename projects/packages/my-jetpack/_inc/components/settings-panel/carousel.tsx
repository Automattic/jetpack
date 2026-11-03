import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Link, SelectControl, Stack, SwitchControl, Text } from '@wordpress/ui';
import { useCallback, useId } from 'react';
import { ModuleToggle } from '../module-toggle';
import styles from './styles.module.scss';
import { useModuleOption, useModuleSetting } from './use-module-option';
import type { ModuleSettingsProps } from './registry';

const COLOR_OPTION = 'carousel_background_color';

type ListOption = { enum?: string[]; enum_labels?: Record< string, string > };

const toColor = ( stored: unknown ) => ( typeof stored === 'string' ? stored : 'black' );

/**
 * The Carousel options, moved here from the Settings screen's Writing tab.
 *
 * @param props          - Component props.
 * @param props.module   - The module.
 * @param props.disabled - Whether the site cannot use the module.
 * @return The settings.
 */
export function CarouselSettings( { module: $module, disabled }: ModuleSettingsProps ) {
	const exif = useModuleOption( $module, 'carousel_display_exif' );
	const comments = useModuleOption( $module, 'carousel_display_comments' );
	const color = useModuleSetting( $module, COLOR_OPTION, toColor );
	const optionsDisabled = ! $module.activated || disabled;
	const labelId = useId();

	// The choices and their labels come from Jetpack, as on the Settings screen.
	const colorOption = (
		Array.isArray( $module.options ) ? undefined : $module.options?.[ COLOR_OPTION ]
	) as ListOption | undefined;
	const colorItems = ( colorOption?.enum ?? [] ).map( value => ( {
		value,
		label: colorOption?.enum_labels?.[ value ] ?? value,
	} ) );
	const { setValue: setColor } = color;
	const onColorChange = useCallback(
		( item: { value: string | null } | null ) => {
			if ( item?.value ) {
				setColor( item.value );
			}
		},
		[ setColor ]
	);

	return (
		<Stack direction="column" gap="lg">
			<Text variant="body-md">
				{ __(
					'Create full-screen carousel slideshows for the images in your posts and pages. Carousel galleries are mobile-friendly and encourage site visitors to interact with your photos.',
					'jetpack-my-jetpack'
				) }
			</Text>
			<Link
				href={ getRedirectUrl( 'jetpack-support-carousel' ) }
				target="_blank"
				rel="noopener noreferrer"
			>
				{ __( 'Learn more about Carousel', 'jetpack-my-jetpack' ) }
			</Link>

			<Stack
				direction="row"
				align="center"
				justify="space-between"
				className={ styles[ 'settings-panel__toggle' ] }
			>
				<Text variant="body-md" id={ labelId }>
					{ __( 'Display images in a full-screen carousel gallery', 'jetpack-my-jetpack' ) }
				</Text>
				<ModuleToggle module={ $module } labelledby={ labelId } disabled={ disabled } />
			</Stack>

			<SwitchControl
				label={ __(
					'Show photo Exif metadata in carousel (when available)',
					'jetpack-my-jetpack'
				) }
				description={ __(
					'Exif data shows viewers additional technical details of a photo, like its focal length, aperture, and ISO.',
					'jetpack-my-jetpack'
				) }
				checked={ exif.value }
				disabled={ optionsDisabled || exif.isSaving }
				onCheckedChange={ exif.setValue }
			/>
			<SwitchControl
				label={ __( 'Show comments area in carousel', 'jetpack-my-jetpack' ) }
				checked={ comments.value }
				disabled={ optionsDisabled || comments.isSaving }
				onCheckedChange={ comments.setValue }
			/>

			{ colorItems.length > 0 && (
				<SelectControl
					label={ __( 'Carousel color scheme', 'jetpack-my-jetpack' ) }
					items={ colorItems }
					value={ colorItems.find( item => item.value === color.value ) ?? null }
					onValueChange={ onColorChange }
					disabled={ optionsDisabled || color.isSaving }
				/>
			) }
		</Stack>
	);
}
