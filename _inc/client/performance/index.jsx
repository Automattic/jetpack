/**
 * External dependencies
 *
 * @format
 */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { getModule } from 'state/modules';
import { isUnavailableInDevMode } from 'state/connection';
import { getModuleOverride } from 'state/modules';
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
			isUnavailableInDevMode: this.props.isUnavailableInDevMode,
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
					title={ __(
						'Load pages faster, optimize images, and speed up your visitors’ experience.'
					) }
					className="jp-settings-description"
				/>

				<SpeedUpSite { ...commonProps } />
				<Media { ...commonProps } />
				<Search { ...commonProps } />
			</div>
		);
	}
}

export default connect( state => {
	return {
		module: module_name => getModule( state, module_name ),
		isUnavailableInDevMode: module_name => isUnavailableInDevMode( state, module_name ),
		isModuleFound: module_name => isModuleFound( state, module_name ),
		getModuleOverride: module_name => getModuleOverride( state, module_name ),
	};
} )( Performance );
