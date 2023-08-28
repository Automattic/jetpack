import registerJetpackBlock from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import { blockIconProp as icon } from './icon';

import './editor.scss';

registerJetpackBlock( metadata.name, {
	// The icon needs to be redefined on the front end as a React component, since a string is
	// interpreted as a dashicon. It also allows us to define the icon color dynamically.
	icon,
	edit,
	save: () => null, // TODO - add Amazon links
} );
