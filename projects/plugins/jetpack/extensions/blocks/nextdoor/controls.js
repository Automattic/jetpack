import { InspectorControls } from '@wordpress/block-editor';
import { Button, PanelBody, ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

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
	const { defaultClassName, nextdoorShareUrl, onFormSubmit, setNextdoorShareUrl } = props;

	return (
		<>
			<PanelBody PanelBody title={ __( 'Embed settings', 'jetpack' ) } initialOpen={ true }>
				<form onSubmit={ onFormSubmit } className={ `${ defaultClassName }-embed-form-sidebar` }>
					<input
						type="text"
						id="nextdoorShareUrl"
						onChange={ event => setNextdoorShareUrl( event.target.value ) }
						placeholder={ __( 'Nextdoor post URL', 'jetpack' ) }
						value={ nextdoorShareUrl || '' }
						className="components-placeholder__input"
					/>
					<div>
						<Button variant="secondary" type="submit">
							{ _x( 'Embed', 'button label', 'jetpack' ) }
						</Button>
					</div>
				</form>
			</PanelBody>
		</>
	);
};

const NextdoorControls = props => {
	return (
		<InspectorControls>
			<CalendlyInspectorControls { ...props } />
		</InspectorControls>
	);
};

export default NextdoorControls;
