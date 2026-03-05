import { __ } from '@wordpress/i18n';
import { Component } from 'react';
import QuerySite from 'components/data/query-site';
import AgentGuidelines from './agent-guidelines';

export class ContentGuidelines extends Component {
	static displayName = 'ContentGuidelinesSettings';

	render() {
		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}

		return (
			<div>
				<QuerySite />
				<h1 className="screen-reader-text">
					{ __( 'Jetpack Content Guidelines Settings', 'jetpack' ) }
				</h1>
				<h2 className="jp-settings__section-title">
					{ this.props.searchTerm
						? __( 'Content Guidelines', 'jetpack' )
						: __(
								'Generate and manage AI-powered content guidelines for your site.',
								'jetpack'
						  ) }
				</h2>
				<AgentGuidelines { ...this.props } />
			</div>
		);
	}
}

export default ContentGuidelines;
