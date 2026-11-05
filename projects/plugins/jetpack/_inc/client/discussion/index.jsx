import { __ } from '@wordpress/i18n';
import { Component } from 'react';
import { connect } from 'react-redux';
import QuerySite from 'components/data/query-site';
import { isModuleFound as _isModuleFound } from 'state/search';
import CommentFeatures from './comment-features';
import CommentForm from './comment-form';

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
				{ foundComments && <CommentForm /> }
				<CommentFeatures />
			</div>
		);
	}
}

export default connect( state => ( {
	isModuleFound: module_name => _isModuleFound( state, module_name ),
} ) )( Discussion );
