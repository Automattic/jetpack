import restApi from '@automattic/jetpack-api';
import { __, sprintf } from '@wordpress/i18n';
import { createNotice, removeNotice } from 'components/global-notices/state/notices/actions';
import { forEach, some } from 'lodash';
import {
	JETPACK_MODULES_LIST_FETCH,
	JETPACK_MODULES_LIST_FETCH_FAIL,
	JETPACK_MODULES_LIST_RECEIVE,
	JETPACK_MODULE_FETCH,
	JETPACK_MODULE_FETCH_FAIL,
	JETPACK_MODULE_RECEIVE,
	JETPACK_MODULE_ACTIVATE,
	JETPACK_MODULE_ACTIVATE_FAIL,
	JETPACK_MODULE_ACTIVATE_SUCCESS,
	JETPACK_MODULE_DEACTIVATE,
	JETPACK_MODULE_DEACTIVATE_FAIL,
	JETPACK_MODULE_DEACTIVATE_SUCCESS,
	JETPACK_MODULE_UPDATE_OPTIONS,
	JETPACK_MODULE_UPDATE_OPTIONS_FAIL,
	JETPACK_MODULE_UPDATE_OPTIONS_SUCCESS,
} from 'state/action-types';
import { getModule } from 'state/modules/reducer';

export const fetchModules = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_MODULES_LIST_FETCH,
		} );
		return restApi
			.fetchModules()
			.then( modules => {
				dispatch( {
					type: JETPACK_MODULES_LIST_RECEIVE,
					modules: modules,
				} );
				return modules;
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_MODULES_LIST_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};

export const fetchModule = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_MODULE_FETCH,
		} );
		return restApi
			.fetchModule()
			.then( data => {
				dispatch( {
					type: JETPACK_MODULE_RECEIVE,
					module: data,
				} );
				return data;
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_MODULE_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};

export const activateModule = ( slug, reloadAfter = false ) => {
	return ( dispatch, getState ) => {
		dispatch( {
			type: JETPACK_MODULE_ACTIVATE,
			module: slug,
		} );
		dispatch( removeNotice( 'module-toggle' ) );
		dispatch(
			createNotice(
				'is-info',
				sprintf(
					/* translators: placeholder is a feature name, such as "Image CDN". */
					__( 'Activating %s…', 'jetpack' ),
					getModule( getState(), slug ).name
				),
				{ id: 'module-toggle' }
			)
		);
		return restApi
			.activateModule( slug )
			.then( () => {
				dispatch( {
					type: JETPACK_MODULE_ACTIVATE_SUCCESS,
					module: slug,
					success: true,
				} );
				dispatch( removeNotice( 'module-toggle' ) );
				dispatch(
					createNotice(
						'is-success',
						sprintf(
							/* translators: placeholder is a feature name, such as "Image CDN". */
							__( '%s has been activated.', 'jetpack' ),
							getModule( getState(), slug ).name
						),
						{ id: 'module-toggle', duration: 2000 }
					)
				);
				if ( reloadAfter ) {
					window.location.reload();
				}
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_MODULE_ACTIVATE_FAIL,
					module: slug,
					success: false,
					error: error,
				} );
				dispatch( removeNotice( 'module-toggle' ) );
				dispatch(
					createNotice(
						'is-error',
						sprintf(
							/* translators: %1$s: feature name, such as "Image CDN". - %2$s: error message. */
							__( '%1$s failed to activate. %2$s', 'jetpack' ),
							getModule( getState(), slug ).name,
							error
						),
						{ id: 'module-toggle' }
					)
				);
			} );
	};
};

export const deactivateModule = ( slug, reloadAfter = false ) => {
	return ( dispatch, getState ) => {
		dispatch( {
			type: JETPACK_MODULE_DEACTIVATE,
			module: slug,
		} );
		dispatch( removeNotice( 'module-toggle' ) );
		dispatch(
			createNotice(
				'is-info',
				sprintf(
					/* translators: placeholder is a feature name, such as "Image CDN". */
					__( 'Deactivating %s…', 'jetpack' ),
					getModule( getState(), slug ).name
				),
				{ id: 'module-toggle' }
			)
		);
		return restApi
			.deactivateModule( slug )
			.then( () => {
				dispatch( {
					type: JETPACK_MODULE_DEACTIVATE_SUCCESS,
					module: slug,
					success: true,
				} );
				dispatch( removeNotice( 'module-toggle' ) );
				dispatch(
					createNotice(
						'is-success',
						sprintf(
							/* translators: placeholder is a feature name, such as "Image CDN". */
							__( '%s has been deactivated.', 'jetpack' ),
							getModule( getState(), slug ).name
						),
						{ id: 'module-toggle', duration: 2000 }
					)
				);
				if ( reloadAfter ) {
					window.location.reload();
				}
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_MODULE_DEACTIVATE_FAIL,
					module: slug,
					success: false,
					error: error,
				} );
				dispatch( removeNotice( 'module-toggle' ) );
				dispatch(
					createNotice(
						'is-error',
						sprintf(
							/* translators: %1$s: feature name, such as "Image CDN". - %2$s: error message. */
							__( '%1$s failed to deactivate. %2$s', 'jetpack' ),
							getModule( getState(), slug ).name,
							error
						),
						{ id: 'module-toggle' }
					)
				);
			} );
	};
};

export const updateModuleOptions = ( module, newOptionValues ) => {
	const slug = module.module;

	return ( dispatch, getState ) => {
		dispatch( {
			type: JETPACK_MODULE_UPDATE_OPTIONS,
			module: slug,
			newOptionValues,
		} );
		dispatch( removeNotice( `module-setting-${ slug }` ) );
		dispatch(
			createNotice(
				'is-info',
				sprintf(
					/* translators: placeholder is a feature name, such as "Image CDN". */
					__( 'Updating %s settings…', 'jetpack' ),
					getModule( getState(), slug ).name
				),
				{ id: `module-setting-${ slug }` }
			)
		);
		return restApi
			.updateModuleOptions( slug, newOptionValues )
			.then( success => {
				dispatch( {
					type: JETPACK_MODULE_UPDATE_OPTIONS_SUCCESS,
					module: slug,
					newOptionValues,
					success: success,
				} );
				maybeHideNavMenuItem( slug, newOptionValues );
				dispatch( removeNotice( `module-setting-${ slug }` ) );
				dispatch(
					createNotice(
						'is-success',
						sprintf(
							/* translators: placeholder is a feature name, such as "Image CDN". */
							__( 'Updated %s settings.', 'jetpack' ),
							getModule( getState(), slug ).name
						),
						{ id: `module-setting-${ slug }`, duration: 2000 }
					)
				);
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_MODULE_UPDATE_OPTIONS_FAIL,
					module: slug,
					success: false,
					error: error,
					newOptionValues,
				} );
				dispatch( removeNotice( `module-setting-${ slug }` ) );
				dispatch(
					createNotice(
						'is-error',
						sprintf(
							/* translators: %1$s: feature name, such as "Image CDN". - %2$s: error message. */
							__( 'Error updating %1$ss settings. %2$s', 'jetpack' ),
							getModule( getState(), slug ).name,
							error
						),
						{ id: `module-setting-${ slug }` }
					)
				);
			} );
	};
};

export const regeneratePostByEmailAddress = () => {
	const slug = 'post-by-email';
	const payload = {
		post_by_email_address: 'regenerate',
	};

	return ( dispatch, getState ) => {
		dispatch( {
			type: JETPACK_MODULE_UPDATE_OPTIONS,
			module: slug,
			newOptionValues: payload,
		} );
		dispatch( removeNotice( `module-setting-${ slug }` ) );
		dispatch(
			createNotice(
				'is-info',
				sprintf(
					/* translators: placeholder is a feature name, such as "Post By Email". */
					__( 'Updating %s address…', 'jetpack' ),
					getModule( getState(), slug ).name
				),
				{ id: `module-setting-${ slug }` }
			)
		);
		return restApi
			.updateModuleOptions( slug, payload )
			.then( success => {
				const newOptionValues = {
					post_by_email_address: success.post_by_email_address,
				};
				dispatch( {
					type: JETPACK_MODULE_UPDATE_OPTIONS_SUCCESS,
					module: slug,
					newOptionValues,
					success: success,
				} );
				dispatch( removeNotice( `module-setting-${ slug }` ) );
				dispatch(
					createNotice(
						'is-success',
						sprintf(
							/* translators: placeholder is a feature name, such as "Post By Email". */
							__( 'Regenerated %s address.', 'jetpack' ),
							getModule( getState(), slug ).name
						),
						{ id: `module-setting-${ slug }`, duration: 2000 }
					)
				);
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_MODULE_UPDATE_OPTIONS_FAIL,
					module: slug,
					success: false,
					error: error,
					newOptionValues: payload,
				} );
				dispatch( removeNotice( `module-setting-${ slug }` ) );
				dispatch(
					createNotice(
						'is-error',
						sprintf(
							/* translators: %1$s: feature name, such as "Post By Email". - %2$s: error message. */
							__( 'Error regenerating %1$s address. %2$s', 'jetpack' ),
							getModule( getState(), slug ).name,
							error
						),
						{ id: `module-setting-${ slug }` }
					)
				);
			} );
	};
};

export function maybeHideNavMenuItem( module, values ) {
	switch ( module ) {
		case 'custom-content-types':
			if ( ! values ) {
				// Means the module was deactivated
				jQuery( '#menu-posts-jetpack-portfolio, #menu-posts-jetpack-testimonial' ).toggle();
			}

			forEach( values, function ( v, key ) {
				if ( 'jetpack_portfolio' === key ) {
					jQuery( '#menu-posts-jetpack-portfolio, .jp-toggle-portfolio' ).toggle();
				}

				if ( 'jetpack_testimonial' === key ) {
					jQuery( '#menu-posts-jetpack-testimonial, .jp-toggle-testimonial' ).toggle();
				}
			} );
			break;
		default:
			return false;
	}
}

export function maybeReloadAfterAction( newOptionValue ) {
	const reloadForOptionValues = [ 'masterbar', 'jetpack_testimonial', 'jetpack_portfolio' ];

	if ( some( reloadForOptionValues, optionValue => optionValue in newOptionValue ) ) {
		window.location.reload();
	}
}
