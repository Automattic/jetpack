import { ExternalLink, Notice } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const CreativeMailPluginErrorState = ( { error } ) => {
	return (
		<Notice isDismissible={ false } status="error">
			{ createInterpolateElement(
				__(
					'The plugin failed to install. <b /> Please check the <a>plugin information</a> for detailed requirements.',
					'jetpack'
				),
				{
					a: (
						<ExternalLink href="https://wordpress.org/plugins/creative-mail-by-constant-contact" />
					),
					b: <span>{ error }</span>,
				}
			) }
		</Notice>
	);
};

export default CreativeMailPluginErrorState;
