import { __ } from '@wordpress/i18n';
import Card from 'components/card';
import QuerySite from 'components/data/query-site';
import React from 'react';
import { connect } from 'react-redux';
import {
	isOfflineMode,
	isUnavailableInOfflineMode,
	isCurrentUserLinked,
	getConnectUrl,
} from 'state/connection';
import { userCanManageModules, userCanEditPosts, isAtomicSite } from 'state/initial-state';
import { isModuleActivated, getModuleOverride, getModule } from 'state/modules';
import { isModuleFound } from 'state/search';
import { getSettings } from 'state/settings';
import Composing from './composing';
import CustomContentTypes from './custom-content-types';
import { Masterbar } from './masterbar';
import PostByEmail from './post-by-email';
import ThemeEnhancements from './theme-enhancements';
import Widgets from './widgets';
import WritingMedia from './writing-media';

export class Writing extends React.Component {
	static displayName = 'WritingSettings';

	render() {
		const commonProps = {
			settings: this.props.settings,
			getModule: this.props.module,
			isOfflineMode: this.props.isOfflineMode,
			isUnavailableInOfflineMode: this.props.isUnavailableInOfflineMode,
			isLinked: this.props.isLinked,
			getModuleOverride: this.props.getModuleOverride,
		};

		const found = [
			'carousel',
			'copy-post',
			'custom-css',
			'latex',
			'masterbar',
			'markdown',
			'shortcodes',
			'custom-content-types',
			'post-by-email',
			'infinite-scroll',
			'widgets',
			'widget-visibility',
			'blocks',
		].some( this.props.isModuleFound );

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}

		if ( ! found ) {
			return null;
		}

		const showComposing = this.props.userCanManageModules || this.props.userCanEditPosts,
			showPostByEmail =
				this.props.userCanManageModules ||
				( this.props.userCanEditPosts && this.props.isModuleActivated( 'post-by-email' ) );

		return (
			<div>
				<QuerySite />
				<h1 className="screen-reader-text">{ __( 'Jetpack Writing Settings', 'jetpack' ) }</h1>
				<Card
					title={
						this.props.searchTerm
							? __( 'Writing', 'jetpack' )
							: __(
									'Compose content the way you want to and streamline your publishing experience.',
									'jetpack'
							  )
					}
					className="jp-settings-description"
				/>
				{ this.props.isModuleFound( 'carousel' ) && <WritingMedia { ...commonProps } /> }
				{ showComposing && (
					<Composing { ...commonProps } userCanManageModules={ this.props.userCanManageModules } />
				) }
				{ this.props.isModuleFound( 'custom-content-types' ) && (
					<CustomContentTypes { ...commonProps } />
				) }
				<ThemeEnhancements { ...commonProps } />
				<Widgets { ...commonProps } />
				{ this.props.isModuleFound( 'post-by-email' ) && showPostByEmail && (
					<PostByEmail
						{ ...commonProps }
						connectUrl={ this.props.connectUrl }
						isLinked={ this.props.isLinked }
						userCanManageModules={ this.props.userCanManageModules }
					/>
				) }
				{ this.props.isModuleFound( 'masterbar' ) && ! this.props.masterbarIsAlwaysActive && (
					<Masterbar connectUrl={ this.props.connectUrl } { ...commonProps } />
				) }
				{ ! showComposing && ! showPostByEmail && (
					<Card>
						{ __(
							'Writing tools available to you will be shown here when an administrator enables them.',
							'jetpack'
						) }
					</Card>
				) }
			</div>
		);
	}
}

export default connect( state => {
	return {
		module: module_name => getModule( state, module_name ),
		settings: getSettings( state ),
		masterbarIsAlwaysActive: isAtomicSite( state ),
		isOfflineMode: isOfflineMode( state ),
		isUnavailableInOfflineMode: module_name => isUnavailableInOfflineMode( state, module_name ),
		userCanEditPosts: userCanEditPosts( state ),
		isModuleActivated: module_name => isModuleActivated( state, module_name ),
		isLinked: isCurrentUserLinked( state ),
		userCanManageModules: userCanManageModules( state ),
		isModuleFound: module_name => isModuleFound( state, module_name ),
		connectUrl: getConnectUrl( state ),
		getModuleOverride: module_name => getModuleOverride( state, module_name ),
	};
} )( Writing );
