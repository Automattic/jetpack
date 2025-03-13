import { resolveSiteUrl } from '../../helpers/utils-helper.js';
import logger from '../../logger.js';
import WpPage from '../wp-page.js';

export default class JetpackModulesPage extends WpPage {
	constructor( page ) {
		const url = resolveSiteUrl() + '/wp-admin/admin.php?page=jetpack_modules';
		super( page, { expectedSelectors: [ '.jetpack-modules-list' ], url } );
	}

	async getModuleCheckbox( moduleSlug ) {
		return this.page.locator( `.jetpack-module#${ moduleSlug } input[type="checkbox"]` );
	}

	async isModuleActive( moduleSlug ) {
		const checkbox = this.getModuleCheckbox( moduleSlug );
		return await checkbox.isChecked();
	}

	async activateModule( moduleName ) {
		const isActive = await this.isModuleActive( moduleName );
		if ( isActive ) {
			logger.info( `Jetpack module ${ moduleName } is already active` );
			return;
		}

		logger.step( `Activating Jetpack module: ${ moduleName }` );
		const checkbox = this.getModuleCheckbox( moduleName );
		await checkbox.click();
	}

	async deactivateModule( moduleName ) {
		const isActive = await this.isModuleActive( moduleName );
		if ( ! isActive ) {
			logger.info( `Jetpack module ${ moduleName } is already deactivated` );
			return;
		}

		logger.step( `Deactivating Jetpack module: ${ moduleName }` );
		const checkbox = this.getModuleCheckbox( moduleName );
		await checkbox.click();
	}
}
