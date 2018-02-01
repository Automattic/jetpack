var PropTypes = require('prop-types');
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/onclick-has-role */
/**
 * External dependencies
 */
var React = require( 'react' ),
	PureRenderMixin = require( 'react-pure-render/mixin' );

/**
 * Internal dependencies
 */

var LegendItem = React.createClass( {
	displayName: 'ModuleChartLegendItem',

	mixins: [ PureRenderMixin ],

	propTypes: {
		checked: PropTypes.bool.isRequired,
		label: PropTypes.oneOfType( [ PropTypes.object, PropTypes.string ] ),
		attr: PropTypes.string.isRequired,
		changeHandler: PropTypes.func.isRequired
	},

	clickHandler: function() {
		this.props.changeHandler( this.props.attr );
	},

	render: function() {
		return (
			<li className="dops-chart__legend-option">
				<label htmlFor="checkbox" className="dops-chart__legend-label is-selectable" onClick={ this.clickHandler } >
					<input type="checkbox" className="dops-chart__legend-checkbox" checked={ this.props.checked } onChange={ function(){} } />
					<span className={ this.props.className }></span>{ this.props.label }
				</label>
			</li>
		);
	}

} );

var Legend = React.createClass( {
	displayName: 'ModuleChartLegend',

	propTypes: {
		activeTab: PropTypes.object.isRequired,
		tabs: PropTypes.array.isRequired,
		activeCharts: PropTypes.array.isRequired,
		availableCharts: PropTypes.array.isRequired,
		clickHandler: PropTypes.func.isRequired
	},

	onFilterChange: function( chartItem ) {
		this.props.clickHandler( chartItem );
	},

	render: function() {
		var legendColors = [ 'dops-chart__legend-color is-dark-blue' ],
			tab = this.props.activeTab,
			legendItems;

		legendItems = this.props.availableCharts.map( function( legendItem, index ) {
			var colorClass = legendColors[ index ],
				checked = ( -1 !== this.props.activeCharts.indexOf( legendItem ) ),
				tab;

			tab = this.props.tabs.filter( function( tab ) {
				return tab.attr === legendItem;
			} ).shift();

			return <LegendItem key={ index } className={ colorClass } label={ tab.label } attr={ tab.attr } changeHandler={ this.onFilterChange } checked={ checked } />;
		}, this );


		return (
			<div className="dops-chart__legend">
				<ul className="dops-chart__legend-options">
					<li className="dops-chart__legend-option" key='default-tab'><span className="dops-chart__legend-label"><span className="dops-chart__legend-color is-wordpress-blue"></span>{ tab.label }</span></li>
					{ legendItems }
				</ul>
			</div>
		);
	}
} );

module.exports = Legend;
