import registerJetpackBlock from '../../shared/register-jetpack-block';
import {
	name as blogRollItemBlockName,
	settings as blogRollItemBlockSettings,
} from './blogroll-item';
import { name, settings } from '.';

registerJetpackBlock( name, settings, [
	{
		name: blogRollItemBlockName,
		settings: blogRollItemBlockSettings,
	},
] );
