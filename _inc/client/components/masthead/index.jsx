/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { getSiteConnectionStatus } from 'state/connection';
import { getCurrentVersion } from 'state/initial-state';

export const Masthead = React.createClass( {
	render: function() {
		let devNotice = this.props.siteConnectionStatus === 'dev'
			? <code>Dev Mode</code>
			: '';

		return (
			<div className="jp-masthead">
				<div className="jp-masthead__inside-container">
					<div className="jp-masthead__logo-container">
						<a className="jp-masthead__logo-link" href="#dashboard">
							<svg className="jp-masthead__logo" x="0" y="0" viewBox="0 0 183 32" enable-background="new 0 0 183 32">
								<path d="M54 10.9v4.8 2.6c0 2.2-0.5 4.3-1.5 5.4 -1.3 1.4-3.3 1.9-5.5 1.9 -3.4 0-5.9-2.6-6-2.7l2-4c0.2 0.2 0.7 1.1 2 1.7 1.2 0.6 2.2 0.8 3 0.3 0.8-0.5 1-2 1-3v-6.1L44 7h6C52.2 7 54 8.7 54 10.9zM81 10.9h5V25h5V10.9h5V7H81V10.9zM115 8.9c1.1 1.1 2 2.8 2 4.6 0 2.1-1 3.8-2.2 4.9 -1.2 1.1-3 1.6-5.1 1.6h-2.6v5H102V7h7.8C112.1 7 113.8 7.7 115 8.9zM112.4 13.4c0-0.9-0.6-1.5-1-1.9 -0.6-0.5-1.4-0.6-2.1-0.6h-2.3V16h2.3c0.7 0 1.4-0.1 2-0.5C111.8 15.1 112.4 14.4 112.4 13.4zM135.8 8.9c1.4 1.4 2.1 3.5 2.1 5.4V25h-5v-5h-6v5h-5V14.3c0-1.9 0.7-4 2.1-5.4 1.3-1.3 3.4-2.4 5.9-2.4C132.5 6.5 134.6 7.7 135.8 8.9zM132.5 12c-0.7-0.7-1.6-1-2.5-1 -0.9 0-1.9 0.3-2.5 1 -0.5 0.6-0.5 1.5-0.5 2.6V16h6v-1.4C132.9 13.5 133 12.6 132.5 12zM61.1 25H75v-3.9h-9v-3.2h7V14h-7v-3.1h9V7H61.1V25zM157.6 20c-0.1 0-0.2 0.1-0.3 0.1 0 0 0 0 0 0 -1 0.5-2.1 0.8-3.4 0.8 -1.5 0-2.9-0.5-3.8-1.5 -1-0.9-1.5-2.2-1.5-3.8 0-1.3 0.5-2.5 1.2-3.4 0.9-1.1 2.3-1.8 4.1-1.8 1 0 1.8 0.2 2.7 0.5 0 0 0.1 0 0.2 0.1 0.1 0 0.2 0.1 0.3 0.1 0 0 0.1 0 0.1 0.1 0.1 0 0.1 0.1 0.2 0.1 0.2 0.1 0.4 0.2 0.6 0.3l1.7-3.6c-0.3-0.2-0.7-0.4-1.1-0.6 -1.3-0.6-2.8-1-4.9-1 -2.8 0-5.5 1.2-7.3 3.1 -1.5 1.6-2.4 3.7-2.4 6.1 0 2.9 1.1 5.2 2.8 6.8 1.7 1.6 4.1 2.5 6.9 2.5 2.3 0 4-0.5 5.4-1.3 0 0 0.1 0 0.1 0 0 0 0 0 0 0 0.2-0.1 0.5-0.3 0.7-0.4l-1.8-3.6C157.9 19.8 157.7 19.9 157.6 20zM182 7h-5.8l-5.2 5.7V7h-3v0h-2v18h2 2.4 0.6v-6.5l0.5-0.5 5.3 7h5.2l-7.5-10.1L182 7zM32 16c0 8.8-7.2 16-16 16S0 24.8 0 16C0 7.2 7.2 0 16 0S32 7.2 32 16zM15 4.7L8.7 15.5c-0.7 1.1 0 2.6 1.2 2.9l5 1.3V4.7zM22 13.5l-5-1.3v15l6.3-10.8C23.9 15.3 23.3 13.9 22 13.5z"/>
							</svg>
						</a>
						{ devNotice }
					</div>

					<ul className="jp-masthead__links">
						<li className="jp-masthead__link-li">
							<a href="https://jetpack.com/support/" target="_blank" className="jp-masthead__link">
								<span className="dashicons dashicons-editor-help" title={ __( 'Need Help?' ) } />
								<span>
									{ __( 'Need Help?' ) }
								</span>
							</a>
						</li>
						<li className="jp-masthead__link-li">
							<a href={ 'http://surveys.jetpack.me/research-plugin?rel=' + this.props.currentVersion } target="_blank" className="jp-masthead__link">
								<span className="dashicons dashicons-admin-comments" title={ __( 'Send us Feedback' ) } />
								<span>
									{ __( 'Send us Feedback' ) }
								</span>
							</a>
						</li>
					</ul>
				</div>
			</div>
		)
	}
} );

export default connect(
	state => {
		return {
			siteConnectionStatus: getSiteConnectionStatus( state ),
			currentVersion: getCurrentVersion( state )
		};
	}
)( Masthead );
