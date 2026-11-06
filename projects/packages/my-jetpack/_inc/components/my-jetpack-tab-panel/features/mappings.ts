import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { JetpackModuleSlug, JetpackProductWithCard } from '../../../types';
import AntiSpamIcon from '../../products-table-view/icons/anti-spam';
import BackupIcon from '../../products-table-view/icons/backup';
import BoostIcon from '../../products-table-view/icons/boost';
import CrmIcon from '../../products-table-view/icons/crm';
import FormsIcon from '../../products-table-view/icons/forms';
import JetpackAiIcon from '../../products-table-view/icons/jetpack-ai';
import ProtectIcon from '../../products-table-view/icons/protect';
import SearchIcon from '../../products-table-view/icons/search';
import SocialIcon from '../../products-table-view/icons/social';
import StatsIcon from '../../products-table-view/icons/stats';
import VideopressIcon from '../../products-table-view/icons/videopress';
import type { ComponentType } from 'react';

export const PRODUCT_ICONS: {
	[ Key in JetpackProductWithCard ]: ComponentType;
} = {
	'anti-spam': AntiSpamIcon,
	backup: BackupIcon,
	boost: BoostIcon,
	'jetpack-ai': JetpackAiIcon,
	'jetpack-forms': FormsIcon,
	crm: CrmIcon,
	protect: ProtectIcon,
	search: SearchIcon,
	social: SocialIcon,
	stats: StatsIcon,
	videopress: VideopressIcon,
};

/**
 * Maps Jetpack products with cards that have different slugs to their corresponding modules
 */
export const PRODUCT_MODULES: {
	[ Key in JetpackProductWithCard ]?: JetpackModuleSlug;
} = {
	social: 'publicize',
	'jetpack-forms': 'contact-form',
	'jetpack-ai': 'ai',
};

/**
 * The product-to-module map to build cards from.
 *
 * Remove the AI pre-release gate when its settings page goes public, with the Jetpack AI
 * branch in resolveFeatureState() that lets AI offer Connect past it.
 *
 * @return The map, without the AI entry while the control is gated.
 */
export function getProductModules() {
	const { showAiModuleToggle = false } = getMyJetpackWindowInitialState( 'myJetpackFlags' );
	if ( showAiModuleToggle ) {
		return PRODUCT_MODULES;
	}

	const gated = { ...PRODUCT_MODULES };
	delete gated[ 'jetpack-ai' ];
	return gated;
}

/**
 * Whether the `my-jetpack-account-connect` flag is on, which shows features waiting for an account
 * and hides Active and Inactive where the feature's control already shows the state.
 *
 * @return Whether Features marks and connects the account a feature needs.
 */
export function isAccountConnectEnabled(): boolean {
	return Boolean( getMyJetpackWindowInitialState( 'myJetpackFlags' ).accountConnect );
}

/**
 * Whether Jetpack AI's switch would show once the site owner connects an account, with nothing else missing.
 *
 * @return Whether the AI card can offer Connect like the other account features.
 */
export function isAiToggleWaitingForAccount(): boolean {
	return Boolean(
		getMyJetpackWindowInitialState( 'myJetpackFlags' ).showAiModuleToggleOnceConnected
	);
}
