/**
 * Sidebar component for Edit Template Modal
 *
 * Contains all control sections: Background Image, Template, Text, Font
 */

import { SelectControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { type ImageType } from '../../../hooks/use-sig-preview/utils';
import { useSocialImageFontOptions } from '../../../hooks/use-social-image-font-options';
import TemplatePicker from '../template-picker/picker';
import { BackgroundImagePicker } from './background-image-picker';
import styles from './styles.module.scss';

interface SidebarProps {
	imageType: ImageType;
	imageId: number | null;
	customText: string;
	template: string | null;
	font: string;
	defaultImageId: number | null;
	featuredImageId: number | null;
	onImageTypeChange: ( value: ImageType ) => void;
	onImageIdChange: ( id: number | null ) => void;
	onCustomTextChange: ( value: string ) => void;
	onTemplateChange: ( value: string ) => void;
	onFontChange: ( value: string ) => void;
}

/**
 * Sidebar component with all control sections
 *
 * @param {SidebarProps} props - Component props
 * @return {JSX.Element} - Sidebar component
 */
export function Sidebar( {
	imageType,
	imageId,
	customText,
	template,
	font,
	defaultImageId,
	featuredImageId,
	onImageTypeChange,
	onImageIdChange,
	onCustomTextChange,
	onTemplateChange,
	onFontChange,
}: SidebarProps ) {
	const { isLoading: isLoadingFontOptions, fontOptions } = useSocialImageFontOptions();

	return (
		<div className={ styles.sidebar }>
			{ /* Background Image Section */ }
			<div className={ styles.section }>
				<div className={ styles.sectionLabel }>
					{ __( 'Background image', 'jetpack-publicize-components' ) }
				</div>
				<BackgroundImagePicker
					imageType={ imageType }
					imageId={ imageId }
					defaultImageId={ defaultImageId }
					featuredImageId={ featuredImageId }
					onImageTypeChange={ onImageTypeChange }
					onImageIdChange={ onImageIdChange }
				/>
			</div>

			{ /* Template Section */ }
			<div className={ styles.section }>
				<div className={ styles.sectionLabel }>
					{ __( 'Template', 'jetpack-publicize-components' ) }
				</div>
				<TemplatePicker
					value={ template }
					onTemplateSelected={ onTemplateChange }
					className={ styles.templateGrid }
				/>
			</div>

			{ /* Text Section */ }
			<div className={ styles.section }>
				<div className={ styles.sectionLabel }>
					{ __( 'Text', 'jetpack-publicize-components' ) }
				</div>
				<TextControl
					value={ customText }
					onChange={ onCustomTextChange }
					placeholder={ __( 'Custom text', 'jetpack-publicize-components' ) }
					help={ __(
						'By default the post title is used for the image. You can use this field to set your own text.',
						'jetpack-publicize-components'
					) }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
			</div>

			{ /* Font Section */ }
			<div className={ styles.section }>
				<div className={ styles.sectionLabel }>
					{ __( 'Font', 'jetpack-publicize-components' ) }
				</div>
				<SelectControl
					value={ font }
					options={ fontOptions }
					onChange={ onFontChange }
					disabled={ isLoadingFontOptions }
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
			</div>
		</div>
	);
}
