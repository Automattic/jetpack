import 'editor-core'; // editor-core is an external dependency
import registerJetpackBlock from '../../shared/register-jetpack-block';
import metadata from './block.json';
import { settings } from '.';

import './editor.scss';

registerJetpackBlock( metadata.name.replace( 'jetpack/', '' ), settings );
