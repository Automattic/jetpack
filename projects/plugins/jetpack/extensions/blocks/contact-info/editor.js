import { createBlock } from '@wordpress/blocks';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import { name as addressName, settings as addressSettings } from './address/';
import metadata from './block.json';
import edit from './edit';
import { name as emailName, settings as emailSettings } from './email/';
import { name as phoneName, settings as phoneSettings } from './phone/';
import save from './save';

import './editor.scss';
import './style.scss';

registerJetpackBlockFromMetadata(
	metadata,
	{
		edit,
		save,
		// Transform from classic widget
		transforms: {
			from: [
				{
					type: 'block',
					blocks: [ 'core/legacy-widget' ],
					isMatch: ( { idBase, instance } ) => {
						if ( ! instance?.raw ) {
							return false;
						}
						return idBase === 'widget_contact_info';
					},
					transform: ( { instance } ) => {
						let innerBlocks = [
							createBlock( 'core/heading', {
								content: instance.raw.title,
							} ),
							createBlock( 'jetpack/email', {
								email: instance.raw.email,
							} ),
							createBlock( 'jetpack/phone', {
								phone: instance.raw.phone,
							} ),
							createBlock( 'jetpack/address', {
								address: instance.raw.address,
							} ),
						];

						if ( instance.raw.hours ) {
							innerBlocks = [
								...innerBlocks,
								createBlock( 'core/paragraph', { content: instance.raw.hours } ),
							];
						}

						if ( instance.raw.showmap && instance.raw.address ) {
							innerBlocks = [
								...innerBlocks,
								createBlock( 'jetpack/map', {
									address: instance.raw.address,
								} ),
							];
						}

						return createBlock( 'jetpack/contact-info', {}, innerBlocks );
					},
				},
			],
		},
	},
	[
		{ name: addressName, settings: addressSettings },
		{ name: emailName, settings: emailSettings },
		{ name: phoneName, settings: phoneSettings },
	]
);
