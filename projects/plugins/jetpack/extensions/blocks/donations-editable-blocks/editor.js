/**
 * Internal dependencies
 */
import registerJetpackBlock from '../../shared/register-jetpack-block';
import { name as donationsBlockName, settings as donationsBlockSettings } from '.';
import {
	name as oneTimeViewName,
	settings as oneTimeViewSettings,
} from './child-blocks/one-time-view/index';
import {
	name as monthlyViewName,
	settings as monthlyViewSettings,
} from './child-blocks/monthly-view/index';
import {
	name as annualViewName,
	settings as annualViewSettings,
} from './child-blocks/annual-view/index';
import {
	name as donationsAmountName,
	settings as donationsAmountSettings,
} from './child-blocks/amount/index';

registerJetpackBlock( donationsBlockName, donationsBlockSettings, [
	{ name: donationsAmountName, settings: donationsAmountSettings },
	{ name: oneTimeViewName, settings: oneTimeViewSettings },
	{ name: monthlyViewName, settings: monthlyViewSettings },
	{ name: annualViewName, settings: annualViewSettings },
] );
