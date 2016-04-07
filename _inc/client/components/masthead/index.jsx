/**
 * External dependencies
 */
var React = require( 'react' );

/**
 * Internal dependencies
 */
var State = require('state/sample-state-tree');

const Masthead = React.createClass( {
	render: function() {
		return (
			<div className="jp-masthead">

				<div className="jp-logo">
					<img src={State.imagePath+"/jetpack-logo.svg"} alt="Jetpack by WordPress.com" />
				</div>

				<ul>
					<li><a href="http://jetpack.com/support/" target="_blank"><span className="dashicons dashicons-editor-help" title="Need Help?"></span><span>Need Help?</span></a></li>
					<li><a href="http://surveys.jetpack.me/research-plugin?rel=3.9.4" target="_blank" id="contextual-help-link"><span className="dashicons dashicons-admin-comments" title="Send us Feedback"></span><span>Send us Feedback</span></a></li>
				</ul>

			</div>
		)
	}
} );

module.exports = Masthead;