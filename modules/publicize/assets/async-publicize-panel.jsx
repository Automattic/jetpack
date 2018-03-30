/*
 * TODO: file header
 */

import { translate as __ } from 'i18n-calypso';

const { PluginPrePublishPanel } = wp.editPost.__experimental;
const { PluginPostPublishPanel } = wp.editPost.__experimental;
const { registerPlugin } = wp.plugins;



// Very rough prototype of form. This needs some work to be better and more modular
const PublicizePanel = () => (
		<PluginPostPublishPanel>
			<div>
				<span>Prototype Publicize Form</span>
				<form className='prototype-publicize-form'>
					<button type='button'>{ __('Share') }</button>
					<input type='text' defaultValue={ __('Custom message') }/>
				</form>
			</div>
		</PluginPostPublishPanel>
);


registerPlugin( 'jetpack-publicize', {
	render: PublicizePanel,
} );
