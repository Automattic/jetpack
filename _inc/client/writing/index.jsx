/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import { getSettings } from 'state/settings';
import { userCanManageModules, userCanEditPosts, isAtomicSite } from 'state/initial-state';
import {
	isDevMode,
	isUnavailableInDevMode,
	isCurrentUserLinked,
	getConnectUrl,
} from 'state/connection';
import { isModuleActivated, getModuleOverride, getModule } from 'state/modules';
import { isModuleFound } from 'state/search';
import QuerySite from 'components/data/query-site';
import Composing from './composing';
import CustomContentTypes from './custom-content-types';
import ThemeEnhancements from './theme-enhancements';
import PostByEmail from './post-by-email';
import Widgets from './widgets';
import { Masterbar } from './masterbar';
import WritingMedia from './writing-media';

export class Writing extends React.Component {
	static displayName = 'WritingSettings';

	render() {
		const commonProps = {
			settings: this.props.settings,
			getModule: this.props.module,
			isDevMode: this.props.isDevMode,
			isUnavailableInDevMode: this.props.isUnavailableInDevMode,
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
			'minileven',
			'widgets',
			'widget-visibility',
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
				<Card
					title={
						this.props.searchTerm
							? __( 'Writing' )
							: __(
									'Compose content the way you want to and streamline your publishing experience.'
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
							'Writing tools available to you will be shown here when an administrator enables them.'
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
		isDevMode: isDevMode( state ),
		isUnavailableInDevMode: module_name => isUnavailableInDevMode( state, module_name ),
		userCanEditPosts: userCanEditPosts( state ),
		isModuleActivated: module_name => isModuleActivated( state, module_name ),
		isLinked: isCurrentUserLinked( state ),
		userCanManageModules: userCanManageModules( state ),
		isModuleFound: module_name => isModuleFound( state, module_name ),
		connectUrl: getConnectUrl( state ),
		getModuleOverride: module_name => getModuleOverride( state, module_name ),
	};
} )( Writing );
