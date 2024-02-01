import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
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

	let externalDocLink = null;

	if ( url ) {
		externalDocLink =
			isAtomicSite() || isSimpleSite()
				? 'https://wordpress.com/support/wordpress-editor/blocks/calendly-block/#customize-the-calendly-block'
				: 'https://jetpack.com/support/jetpack-blocks/calendly-block/#customizing-a-calendly-block';
	}

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
						<Button variant="secondary" type="submit">
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
			{ externalDocLink && (
				<Notice className={ `${ defaultClassName }-color-notice` } isDismissible={ false }>
					<ExternalLink href={ externalDocLink }>
						{ __( 'Explore more customization options.', 'jetpack' ) }
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
