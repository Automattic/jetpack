/**
 * Internal dependencies
 */
import registerJetpackBlock from 'presets/jetpack/utils/register-jetpack-block';
import { childBlocks, name, settings } from '.';

registerJetpackBlock( name, settings, childBlocks );
