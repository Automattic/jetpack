import { childBlocks } from './child-blocks';
import registerJetpackBlock from './util/register-jetpack-block';
import { name, settings } from '.';

import '../field-text/editor';

registerJetpackBlock( name, settings, childBlocks );
