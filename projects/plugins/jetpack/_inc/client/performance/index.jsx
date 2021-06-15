/**
 * External dependencies
 *
 * @format
 */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getModule, getModuleOverride } from 'state/modules';
import { isUnavailableInOfflineMode } from 'state/connection';
import { isModuleFound } from 'state/search';
import Card from 'components/card';
import QuerySite from 'components/data/query-site';
import Media from './media';
import Search from './search';
import SpeedUpSite from './speed-up-site';

class Performance extends Component {
	render() {
		const commonProps = {
			getModule: this.props.module,
			isUnavailableInOfflineMode: this.props.isUnavailableInOfflineMode,
			isModuleFound: this.props.isModuleFound,
			getModuleOverride: this.props.getModuleOverride,
		};

		const found = [ 'photon', 'videopress', 'lazy-images', 'photon-cdn', 'search' ].some(
			this.props.isModuleFound
		);

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}

		if ( ! found ) {
			return null;
		}

		return (
			<div>
				<QuerySite />
				<Card
					title={
						this.props.searchTerm
							? __( 'Performance', 'jetpack' )
							: __(
									'Load pages faster, optimize images, and speed up your visitors’ experience.',
									'jetpack'
							  )
					}
					className="jp-settings-description"
				/>
				<Search { ...commonProps } />
				<SpeedUpSite { ...commonProps } />
				<Media { ...commonProps } />
			</div>
		);
	}
}

export default connect( state => {
	return {
		module: module_name => getModule( state, module_name ),
		isUnavailableInOfflineMode: module_name => isUnavailableInOfflineMode( state, module_name ),
		isModuleFound: module_name => isModuleFound( state, module_name ),
		getModuleOverride: module_name => getModuleOverride( state, module_name ),
	};
} )( Performance );
