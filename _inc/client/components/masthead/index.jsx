var React = require( 'react' );
var State = require('state/sample-state-tree');

const Masthead = React.createClass( {
	render: function() {
		return (
			<div className='jp-masthead'>

				<img src={State.imagePath+"/jetpack-logo.svg"} alt="Jetpack by WordPress.com" />

				<ul>
					<li><a href="#">Need Help?</a></li>
					<li><a href="#" id="contextual-help-link">Send us Feedback</a></li>
				</ul>
			</div>
		)
	}
} );

module.exports = Masthead;