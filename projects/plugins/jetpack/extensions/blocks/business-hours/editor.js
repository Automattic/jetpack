import registerJetpackBlock from '../../shared/register-jetpack-block';
import metadata from './block.json';
import BusinessHours from './edit';
import { blockIconProp as icon } from './icon';

import './editor.scss';
import './style.scss';

registerJetpackBlock( metadata.name, {
	// The icon needs to be redefined on the front end as a React component, since a string is
	// interpreted as a dashicon. It also allows us to define the icon color dynamically.
	icon,
	edit: props => <BusinessHours { ...props } />,
	save: () => null,
} );
