/**
 * Internal dependencies
 */
import registerJetpackBlock from '../../shared/register-jetpack-block';
import { name as donationsBlockName, settings as donationsBlockSettings } from '.';
import {
	name as donationsViewName,
	settings as donationsViewSettings,
} from './donations-view/index';
import { name as donationsAmountName, settings as donationsAmountSettings } from './amount/index';
import {
	name as customDonationsAmountName,
	settings as customDonationsAmountSettings,
} from './custom-amount/index';

registerJetpackBlock( donationsBlockName, donationsBlockSettings, [
	{ name: donationsAmountName, settings: donationsAmountSettings },
	{ name: donationsViewName, settings: donationsViewSettings },
	{ name: donationsAmountName, settings: donationsAmountSettings },
	{ name: customDonationsAmountName, settings: customDonationsAmountSettings },
] );
