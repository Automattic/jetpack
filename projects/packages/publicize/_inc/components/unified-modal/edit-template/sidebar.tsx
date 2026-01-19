/**
 * Sidebar component for Edit Template Modal
 *
 * Contains all control sections: Background Image, Template, Text, Font
 */

import { SelectControl, TextControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { type ImageType } from '../../../hooks/use-sig-preview/utils';
import { useSocialImageFontOptions } from '../../../hooks/use-social-image-font-options';
import TemplatePicker from '../../social-image-generator/template-picker/picker';
import { BackgroundImagePicker } from './background-image-picker';
import styles from './styles.module.scss';
import { LocalState } from './types';

type SidebarProps = {
	localState: LocalState;
	setLocalState: React.Dispatch< React.SetStateAction< LocalState > >;
	defaultImageId: number | null;
	featuredImageId: number | null;
};

/**
 * Sidebar component with all control sections
 *
 * @param {SidebarProps} props - Component props
 * @return Sidebar component
 */
export function Sidebar( {
	localState,
	setLocalState,
	defaultImageId,
	featuredImageId,
}: SidebarProps ) {
	const { isLoading: isLoadingFontOptions, fontOptions } = useSocialImageFontOptions();

	const handleImageTypeChange = useCallback(
		( value: ImageType ) => {
			setLocalState( prev => ( { ...prev, imageType: value } ) );
		},
		[ setLocalState ]
	);

	const handleImageIdChange = useCallback(
		( id: number | null ) => {
			setLocalState( prev => ( { ...prev, imageId: id } ) );
		},
		[ setLocalState ]
	);

	const handleCustomTextChange = useCallback(
		( value: string ) => {
			setLocalState( prev => ( { ...prev, customText: value } ) );
		},
		[ setLocalState ]
	);

	const handleTemplateChange = useCallback(
		( value: string ) => {
			setLocalState( prev => ( { ...prev, template: value } ) );
		},
		[ setLocalState ]
	);

	const handleFontChange = useCallback(
		( value: string ) => {
			setLocalState( prev => ( { ...prev, font: value } ) );
		},
		[ setLocalState ]
	);

	return (
		<div className={ styles.sidebar }>
			{ /* Background Image Section */ }
			<fieldset className={ styles.section }>
				<legend className={ styles.sectionLabel }>
					{ __( 'Background image', 'jetpack-publicize-pkg' ) }
				</legend>
				<BackgroundImagePicker
					imageType={ localState.imageType }
					imageId={ localState.imageId }
					defaultImageId={ defaultImageId }
					featuredImageId={ featuredImageId }
					onImageTypeChange={ handleImageTypeChange }
					onImageIdChange={ handleImageIdChange }
				/>
			</fieldset>

			{ /* Template Section */ }
			<fieldset className={ styles.section }>
				<legend className={ styles.sectionLabel }>
					{ __( 'Template', 'jetpack-publicize-pkg' ) }
				</legend>
				<TemplatePicker
					value={ localState.template }
					onTemplateSelected={ handleTemplateChange }
					className={ styles.templateGrid }
				/>
			</fieldset>

			{ /* Text Section */ }
			<fieldset className={ styles.section }>
				<legend className={ styles.sectionLabel }>{ __( 'Text', 'jetpack-publicize-pkg' ) }</legend>
				<TextControl
					value={ localState.customText }
					onChange={ handleCustomTextChange }
					placeholder={ __( 'Custom text', 'jetpack-publicize-pkg' ) }
					help={ __(
						'By default the post title is used for the image. You can use this field to set your own text.',
						'jetpack-publicize-pkg'
					) }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
			</fieldset>

			{ /* Font Section */ }
			<fieldset className={ styles.section }>
				<legend className={ styles.sectionLabel }>{ __( 'Font', 'jetpack-publicize-pkg' ) }</legend>
				<SelectControl
					value={ localState.font }
					options={ fontOptions }
					onChange={ handleFontChange }
					disabled={ isLoadingFontOptions }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
			</fieldset>
		</div>
	);
}
