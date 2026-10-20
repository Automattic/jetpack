import CommentFormSettings from '@automattic/jetpack-comments/settings';
import { __ } from '@wordpress/i18n';
import { Component } from 'react';
import { connect } from 'react-redux';
import QuerySite from 'components/data/query-site';
import { isUnavailableInOfflineMode } from 'state/connection';
import { isCommentBlocksAvailable, getCommentFormPreview } from 'state/initial-state';
import { fetchModules } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';
import { clearUnsavedSettingsFlag, fetchSettings, setUnsavedSettingsFlag } from 'state/settings';
import CommentFeatures from './comment-features';

export class Discussion extends Component {
	static displayName = 'DiscussionSettings';

	render() {
		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}

		const foundComments = this.props.isModuleFound( 'comments' ),
			foundMarkdown = this.props.isModuleFound( 'markdown' ),
			foundGravatar = this.props.isModuleFound( 'gravatar-hovercards' ),
			foundCommentLikes = this.props.isModuleFound( 'comment-likes' );

		if ( ! foundComments && ! foundMarkdown && ! foundGravatar && ! foundCommentLikes ) {
			return null;
		}

		return (
			<div>
				<QuerySite />
				<h1 className="screen-reader-text">{ __( 'Jetpack Discussion Settings', 'jetpack' ) }</h1>
				{ this.props.searchTerm && (
					<h2 className="jp-settings__section-title">{ __( 'Discussion', 'jetpack' ) }</h2>
				) }
				{ foundComments && (
					<CommentFormSettings
						preview={ this.props.commentFormPreview }
						hasBlockEditor={ this.props.hasBlockEditor }
						isUnavailable={ this.props.isUnavailableInOfflineMode( 'comments' ) }
						onSave={ this.props.refreshSettings }
						onDirtyChange={ this.props.setUnsaved }
					/>
				) }
				<CommentFeatures />
			</div>
		);
	}
}

export default connect(
	state => ( {
		isUnavailableInOfflineMode: module_name => isUnavailableInOfflineMode( state, module_name ),
		isModuleFound: module_name => _isModuleFound( state, module_name ),
		hasBlockEditor: isCommentBlocksAvailable( state ),
		commentFormPreview: getCommentFormPreview( state ),
	} ),
	dispatch => ( {
		// The card saves through its own requests, so the dashboard's copies need a refresh.
		refreshSettings: () => {
			dispatch( fetchSettings() );
			dispatch( fetchModules() );
		},
		// Leaving the tab with unsaved changes asks first, as it does for the dashboard's own forms.
		setUnsaved: isDirty =>
			dispatch( isDirty ? setUnsavedSettingsFlag() : clearUnsavedSettingsFlag() ),
	} )
)( Discussion );
