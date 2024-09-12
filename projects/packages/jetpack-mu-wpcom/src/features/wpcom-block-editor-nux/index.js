/*** THIS MUST BE THE FIRST THING EVALUATED IN THIS SCRIPT *****/
import '../../common/public-path';
import { register } from './src/store';

import './src/disable-core-nux';
import './src/block-editor-nux';

register();
