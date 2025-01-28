import { __ } from '@wordpress/i18n';
import React from 'react';
import { connect } from 'react-redux';
import Card from 'components/card';
import QuerySite from 'components/data/query-site';
import {
	isOfflineMode,
	isUnavailableInOfflineMode,
	isCurrentUserLinked,
	getConnectUrl,
} from 'state/connection';
import { getActiveFeatureDetails } from 'state/feature-check';
import { userCanManageModules, userCanEditPosts } from 'state/initial-state';
import { isModuleActivated, getModuleOverride, getModule } from 'state/modules';
import { isModuleFound } from 'state/search';
import { getSettings } from 'state/settings';
import Composing from './composing';
import CustomContentTypes from './custom-content-types';
import PostByEmail from './post-by-email';
import ThemeEnhancements from './theme-enhancements';
import Widgets from './widgets';
import WritingMedia from './writing-media';

export class Writing extends React.Component {
	static displayName = 'WritingSettings';

	constructor( props ) {
		super( props );

		const customContentTypeStatusInitialState = window?.CUSTOM_CONTENT_TYPE__INITIAL_STATE?.active
			? window.CUSTOM_CONTENT_TYPE__INITIAL_STATE.active
			: false;

		const customContentTypeOverrideStatusInitialState = window?.CUSTOM_CONTENT_TYPE__INITIAL_STATE
			?.over_ride
			? window.CUSTOM_CONTENT_TYPE__INITIAL_STATE.over_ride
			: false;

		this.state = {
			customContentTypeIsActive: customContentTypeStatusInitialState,
			customContentTypeIsOverridden: customContentTypeOverrideStatusInitialState,
			customContentKeywords: [],
		};

		// Call async initialization directly
		this.initializeCustomContentTypes();
	}

	initializeCustomContentTypes() {
		this.props
			.getActiveFeatureDetails()
			.then( response => {
				if ( response && response[ 'custom-content-types' ].active !== undefined ) {
					this.setState( {
						customContentTypeIsActive: response[ 'custom-content-types' ].active,
						customContentTypeIsOverridden: response[ 'custom-content-types' ].over_ride,
						customContentKeywords: [
							...response[ 'custom-content-types' ].additional_search_queries
								.split( ',' )
								.map( keyword => keyword.trim().toLowerCase() ),
							...response[ 'custom-content-types' ].description
								.toLowerCase()
								.split( ' ' )
								.map( word => word.trim() ),
						],
					} );
				} else {
					this.setState( { customContentTypeIsActive: false } );
				}
			} )
			.catch( error => {
				// eslint-disable-next-line no-console
				console.error( 'Error fetching custom content type status:', error );

				// Update state to reflect that the route doesn't exist or an error occurred
				this.setState( { customContentTypeIsActive: false } );
			} );
	}

	render() {
		const commonProps = {
			settings: this.props.settings,
			getModule: this.props.module,
			isOfflineMode: this.props.isOfflineMode,
			isUnavailableInOfflineMode: this.props.isUnavailableInOfflineMode,
			isLinked: this.props.isLinked,
			getModuleOverride: this.props.getModuleOverride,
			customContentTypeIsActive: this.state.customContentTypeIsActive || false,
			customContentTypeIsOverridden: this.state.customContentTypeIsOverridden || false,
		};

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}

		const found = [
			'carousel',
			'copy-post',
			'latex',
			'markdown',
			'shortcodes',
			'post-by-email',
			'infinite-scroll',
			'widgets',
			'widget-visibility',
			'blocks',
		].some( this.props.isModuleFound );
		if ( ! found && ! this.state.customContentTypeIsActive ) {
			return null;
		}

		const shouldRenderCustomContent =
			( this.state.customContentTypeIsActive && this.props.searchTerm === '' ) ||
			( this.state.customContentTypeIsActive &&
				this.state.customContentKeywords.includes( this.props.searchTerm?.toLowerCase() ) );

		const showComposing = this.props.userCanManageModules || this.props.userCanEditPosts,
			showPostByEmail =
				this.props.userCanManageModules ||
				( this.props.userCanEditPosts && this.props.isModuleActivated( 'post-by-email' ) );

		return (
			<div>
				<QuerySite />
				<h1 className="screen-reader-text">{ __( 'Jetpack Writing Settings', 'jetpack' ) }</h1>
				<h2 className="jp-settings__section-title">
					{ this.props.searchTerm
						? __( 'Writing', 'jetpack' )
						: __(
								'Compose content the way you want to and streamline your publishing experience.',
								'jetpack'
						  ) }
				</h2>
				{ this.props.isModuleFound( 'carousel' ) && <WritingMedia { ...commonProps } /> }
				{ showComposing && (
					<Composing { ...commonProps } userCanManageModules={ this.props.userCanManageModules } />
				) }
				{ shouldRenderCustomContent && <CustomContentTypes { ...commonProps } /> }
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

export default connect(
	state => {
		return {
			module: module_name => getModule( state, module_name ),
			settings: getSettings( state ),
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
	},
	dispatch => ( {
		getActiveFeatureDetails: () => {
			return dispatch( getActiveFeatureDetails( 'custom-content-types' ) );
		},
	} )
)( Writing );
