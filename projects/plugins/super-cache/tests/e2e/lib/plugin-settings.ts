import { expect } from '@jest/globals';
import { load as parseDom } from 'cheerio';
import HtmlForm from './CheerioForm';
import { authenticatedRequest, getSiteUrl } from './plugin-tools';

export enum ModRewriteOptions {
	Simple = '0',
	Expert = '1',
}

/**
 * Description of how to write each setting, by name.
 */
const settingsHandlers = {
	wp_cache_enabled: async ( authCookie: string, value: boolean ) => {
		await submitSettingsForm( authCookie, 'settings', 'scupdates', form => {
			form.setCheckbox( 'wp_cache_enabled', value );
		} );
	},

	wp_cache_mod_rewrite: async ( authCookie: string, value: ModRewriteOptions ) => {
		await submitSettingsForm( authCookie, 'settings', 'scupdates', form => {
			form.setValue( 'wp_cache_mod_rewrite', value );
		} );
	},
};

type SettingName = keyof typeof settingsHandlers;
type SettingMethod< Name extends SettingName > = typeof settingsHandlers[ Name ];
type SettingParams< Name extends SettingName > = Parameters< SettingMethod< Name > >;
type SettingValue< Name extends SettingName > = SettingParams< Name >[ 1 ];

type Settings = {
	[ Name in SettingName ]: SettingValue< Name >;
};

/**
 * Update the plugin settings as specified in the settings object.
 *
 * @param {string}   authCookie - Auth cookie for the admin user.
 * @param {Settings} settings   - Object with settings to update and their values.
 */
export async function updateSettings( authCookie: string, settings: Partial< Settings > ) {
	for ( const [ name, value ] of Object.entries( settings ) ) {
		await settingsHandlers[ name ]( authCookie, value );
	}
}

/**
 * Helper method to load, edit and submit a settings form.
 *
 * @param {string}   authCookie - Auth cookie for the admin user.
 * @param {string}   tab        - The name of the settings tab to submit a form from.
 * @param {string}   action     - The action name of the form to submit.
 * @param {Function} callback   - Callback to edit the form after loading it.
 */
async function submitSettingsForm(
	authCookie: string,
	tab: string,
	action: string,
	callback: ( form: HtmlForm ) => void
) {
	const html = await authenticatedRequest(
		authCookie,
		'GET',
		getSiteUrl( `/wp-admin/options-general.php`, {
			page: 'wpsupercache',
			tab,
		} )
	);

	const dom = parseDom( html );

	const actionInput = dom( 'input[name=action][value=' + action + ']' );
	expect( actionInput.length ).toBe( 1 );

	const formElement = actionInput.closest( 'form' );
	expect( formElement.length ).toBe( 1 );

	const form = new HtmlForm( formElement );
	callback( form );

	await form.submit( authCookie );
}
