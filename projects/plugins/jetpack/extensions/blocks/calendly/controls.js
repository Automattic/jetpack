/**
 * WordPress dependencies
 */
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import {
	Button,
	ExternalLink,
	Notice,
	PanelBody,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
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

export const CalendlyInspectorControls = props => {
	const {
		attributes: { hideEventTypeDetails, url },
		defaultClassName,
		embedCode,
		parseEmbedCode,
		setAttributes,
		setEmbedCode,
	} = props;

	return (
		<>
			<PanelBody PanelBody title={ __( 'Calendar settings', 'jetpack' ) } initialOpen={ false }>
				<form onSubmit={ parseEmbedCode } className={ `${ defaultClassName }-embed-form-sidebar` }>
					<input
						type="text"
						id="embedCode"
						onChange={ event => setEmbedCode( event.target.value ) }
						placeholder={ __( 'Calendly web address or embed code…', 'jetpack' ) }
						value={ embedCode || '' }
						className="components-placeholder__input"
					/>
					<div>
						<Button isSecondary type="submit">
							{ _x( 'Embed', 'button label', 'jetpack' ) }
						</Button>
					</div>
				</form>

				<ToggleControl
					label={ __( 'Hide event type details', 'jetpack' ) }
					checked={ hideEventTypeDetails }
					onChange={ () => setAttributes( { hideEventTypeDetails: ! hideEventTypeDetails } ) }
				/>
			</PanelBody>
			{ url && (
				<Notice className={ `${ defaultClassName }-color-notice` } isDismissible={ false }>
					<ExternalLink href="https://help.calendly.com/hc/en-us/community/posts/360033166114-Embed-Widget-Color-Customization-Available-Now-">
						{ __( 'Follow these instructions to change the colors in this block.', 'jetpack' ) }
					</ExternalLink>
				</Notice>
			) }
		</>
	);
};

const CalendlyControls = props => {
	const { attributes, clientId, isEditingUrl, setAttributes, setIsEditingUrl } = props;
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
					clientId={ clientId }
					styleOptions={ styleOptions }
					onSelectStyle={ setAttributes }
					activeStyle={ style }
					attributes={ attributes }
					viewportWidth={ 500 }
				/>
			) }
			<InspectorControls>
				<CalendlyInspectorControls { ...props } />
			</InspectorControls>
		</>
	);
};

export default CalendlyControls;
