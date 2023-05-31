import { childBlocks } from './child-blocks';
import registerJetpackBlock from './util/register-jetpack-block';
import { name, settings } from '.';

registerJetpackBlock( name, settings, childBlocks );
