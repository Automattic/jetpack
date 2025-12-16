import { childBlocks } from './child-blocks.js';
import registerJetpackBlock from './util/register-jetpack-block.js';
import { name, settings } from '.';

registerJetpackBlock( name, settings, childBlocks );
