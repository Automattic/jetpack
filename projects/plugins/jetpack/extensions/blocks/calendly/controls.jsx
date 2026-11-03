import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	TextControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { Link, Text } from '@wordpress/ui';
import BlockStylesSelector from '../../shared/components/block-styles-selector';

export const CalendlyBlockControls = ( { onEditClick } ) => {
	return (
		<ToolbarGroup>
			<ToolbarButton onClick={ () => onEditClick( true ) }>
				{ __( 'Edit', 'jetpack' ) }
			</ToolbarButton>
		</ToolbarGroup>
	);
};

export const CalendlyCustomizationLink = () => {
	const externalDocLink = isWpcomPlatformSite()
		? 'https://wordpress.com/support/wordpress-editor/blocks/calendly-block/#customize-the-calendly-block'
		: 'https://jetpack.com/support/jetpack-blocks/calendly-block/#customizing-a-calendly-block';

	return (
		<Text render={ <div /> }>
			<Link openInNewTab href={ externalDocLink }>
				{ __( 'Explore customization options', 'jetpack' ) }
			</Link>
		</Text>
	);
};

export const CalendlyInspectorControls = props => {
	const {
		attributes: { hideEventTypeDetails },
		defaultClassName,
		embedCode,
		parseEmbedCode,
		setAttributes,
		setEmbedCode,
	} = props;

	return (
		<PanelBody title={ __( 'Calendar settings', 'jetpack' ) } initialOpen={ false }>
			<form onSubmit={ parseEmbedCode } className={ `${ defaultClassName }-embed-form-sidebar` }>
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					hideLabelFromVision
					label={ __( 'Calendly web address or embed code', 'jetpack' ) }
					id="embedCode"
					onChange={ setEmbedCode }
					placeholder={ __( 'Calendly web address or embed code…', 'jetpack' ) }
					value={ embedCode || '' }
				/>
				<Button __next40pxDefaultSize variant="secondary" type="submit">
					{ _x( 'Embed', 'button label', 'jetpack' ) }
				</Button>
			</form>

			<ToggleControl
				__nextHasNoMarginBottom={ true }
				label={ __( 'Hide event type details', 'jetpack' ) }
				checked={ hideEventTypeDetails }
				onChange={ () => setAttributes( { hideEventTypeDetails: ! hideEventTypeDetails } ) }
			/>
		</PanelBody>
	);
};

const CalendlyControls = props => {
	const { attributes, isEditingUrl, setAttributes, setIsEditingUrl } = props;
	const { style, url } = attributes;
	const styleOptions = [
		{ value: 'inline', label: __( 'Inline', 'jetpack' ) },
		{ value: 'link', label: __( 'Link', 'jetpack' ) },
	];

	return (
		<>
			{ url && ! isEditingUrl && (
				<BlockControls>
					<CalendlyBlockControls onEditClick={ setIsEditingUrl } />
				</BlockControls>
			) }
			{ url && (
				<BlockStylesSelector
					styleOptions={ styleOptions }
					onSelectStyle={ setAttributes }
					activeStyle={ style }
				>
					<CalendlyCustomizationLink />
				</BlockStylesSelector>
			) }
			<InspectorControls>
				<CalendlyInspectorControls { ...props } />
			</InspectorControls>
		</>
	);
};

export default CalendlyControls;
