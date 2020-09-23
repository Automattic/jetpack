/**
 * External dependencies
 */
import { ExternalLink, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { jetpackCreateInterpolateElement } from '../../../shared/create-interpolate-element';

const CreativeMailPluginErrorState = ( { error } ) => {
	return (
		<Notice isDismissible={ false } status="error">
			{ jetpackCreateInterpolateElement(
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
