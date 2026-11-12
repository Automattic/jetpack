import { __ } from '@wordpress/i18n';
import { Component } from 'react';
import { connect } from 'react-redux';
import QuerySite from 'components/data/query-site';
import { FeaturesPointer } from 'components/pointer-card';
import { isSettingsConsolidationEnabled } from 'lib/settings-consolidation';
import { isUnavailableInOfflineMode, hasConnectedOwner } from 'state/connection';
import { getModule, getModuleOverride } from 'state/modules';
import { isModuleFound } from 'state/search';
import Media from './media';
import Search from './search';
import SpeedUpSite from './speed-up-site';

export class Performance extends Component {
	render() {
		const commonProps = {
			getModule: this.props.module,
			isUnavailableInOfflineMode: this.props.isUnavailableInOfflineMode,
			isModuleFound: this.props.isModuleFound,
			getModuleOverride: this.props.getModuleOverride,
			hasConnectedOwner: this.props.hasConnectedOwner,
		};

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}

		// Once settings move out, every card here shows only in search results, as a link to its new home.
		const consolidated = isSettingsConsolidationEnabled(),
			isFound = module =>
				this.props.isModuleFound( module ) && ( ! consolidated || !! this.props.searchTerm ),
			foundSearch = isFound( 'search' ),
			foundVideoPress = isFound( 'videopress' ),
			foundSiteAccelerator = isFound( 'photon' ) || isFound( 'photon-cdn' ),
			found = foundSearch || foundVideoPress || foundSiteAccelerator;

		if ( ! found ) {
			return null;
		}

		return (
			<div>
				<QuerySite />
				<h1 className="screen-reader-text">{ __( 'Jetpack Performance Settings', 'jetpack' ) }</h1>
				{ this.props.searchTerm && (
					<h2 className="jp-settings__section-title">{ __( 'Performance', 'jetpack' ) }</h2>
				) }
				{ ( ! consolidated || foundSearch ) && <Search { ...commonProps } /> }
				{ consolidated ? (
					foundSiteAccelerator && (
						<FeaturesPointer
							header={ __( 'Site Accelerator', 'jetpack' ) }
							name={ __( 'Image CDN and Asset CDN', 'jetpack' ) }
							search="cdn"
							linksToSettings={ false }
						/>
					)
				) : (
					<SpeedUpSite { ...commonProps } />
				) }
				{ consolidated ? (
					foundVideoPress && (
						<FeaturesPointer
							header={ __( 'VideoPress', 'jetpack' ) }
							name="VideoPress"
							search="videopress"
						/>
					)
				) : (
					<Media { ...commonProps } />
				) }
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
		hasConnectedOwner: hasConnectedOwner( state ),
	};
} )( Performance );
