import { registerBlockType } from '@wordpress/blocks';
import { name, settings } from '.';

// TODO: Is there a reason not to include the `jetpack/` prefix in the name
// from the start?
registerBlockType( `jetpack/${ name }`, settings );
