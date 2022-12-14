import registerJetpackBlock from '../../shared/register-jetpack-block';
import { childBlocks } from './child-blocks';
import { name, settings } from '.';

registerJetpackBlock( name, settings, childBlocks );
