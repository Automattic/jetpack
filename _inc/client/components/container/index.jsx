var React = require( 'react' );

var container = React.createClass( {
	getInitialState: function() {
		return {
			echo: 'Talk to yourself'
		}
	},
	handleChange: function( e ) {
		this.setState( {
			echo: e.target.value
		} );
	},
	render: function() {
		return (
			<div className='container'>
				<h1>{ this.state.echo }</h1>
				<input type="text" value={ this.state.echo } onChange={ this.handleChange } />
			</div>
		);
	}
} );

module.exports = container;
