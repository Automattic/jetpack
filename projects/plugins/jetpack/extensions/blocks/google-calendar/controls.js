import { Button, PanelBody } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

export const GoogleCalendarInspectorControls = props => {
	const { className, embedValue, onChange, onSubmit } = props;

	return (
		<PanelBody title={ __( 'Calendar settings', 'jetpack' ) } initialOpen={ false }>
			<form onSubmit={ onSubmit } className={ className }>
				<textarea
					type="text"
					value={ embedValue }
					className="components-placeholder__input"
					aria-label={ __( 'Google Calendar URL or iframe', 'jetpack' ) }
					placeholder={ __( 'Enter URL or iframe to embed here…', 'jetpack' ) }
					onChange={ onChange }
				/>
				<Button variant="secondary" type="submit">
					{ _x( 'Embed', 'button label', 'jetpack' ) }
				</Button>
			</form>
		</PanelBody>
	);
};

export default GoogleCalendarInspectorControls;
