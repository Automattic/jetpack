/**
 * Internal dependencies
 */
import { name, settings } from '../';
import { settings as jpButtonSettings } from '../../button';
import { settings as paymentButtonSettings } from '../button';
import runBlockFixtureTests from '../../../shared/test/block-fixtures';

const blocks = [
	{ name: `jetpack/${ name }`, settings },
	{ name: `jetpack/recurring-payments-button`, settings: paymentButtonSettings },
	{ name: `jetpack/button`, settings: jpButtonSettings },
];

runBlockFixtureTests( `jetpack/${ name }`, blocks, __dirname );
