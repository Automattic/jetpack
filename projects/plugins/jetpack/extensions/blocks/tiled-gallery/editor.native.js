/**
 * Internal dependencies
 */
import registerJetpackBlock from '../../shared/register-jetpack-block';
import { childBlocks, name, settings, animal } from '.';
alert( JSON.stringify( childBlocks ) );

registerJetpackBlock( name, settings, childBlocks );
