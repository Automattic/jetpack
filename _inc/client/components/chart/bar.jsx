/* eslint-disable jsx-a11y/click-events-have-key-events */
/**
 * External dependencies
 */
import PropTypes from 'prop-types';

import React from 'react';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import Tooltip from 'components/tooltip';

import Gridicon from 'components/gridicon';

export default class ModuleChartBar extends React.Component {
	static displayName = 'ModuleChartBar';

	static propTypes = {
		isTouch: PropTypes.bool,
		tooltipPosition: PropTypes.string,
		className: PropTypes.string,
		clickHandler: PropTypes.func,
		data: PropTypes.object.isRequired,
		max: PropTypes.number,
		count: PropTypes.number,
	};

	state = { showPopover: false };

	buildSections = () => {
		const value = this.props.data.value,
			max = this.props.max,
			percentage = max ? Math.ceil( ( value / max ) * 10000 ) / 100 : 0,
			remain = 100 - percentage,
			remainFloor = Math.max( 1, Math.floor( remain ) ),
			sections = [],
			nestedValue = this.props.data.nestedValue,
			spacerClassOptions = {
				'dops-chart__bar-section': true,
				'is-spacer': true,
				'is-ghost': 100 === remain && ! this.props.active,
			};
		let nestedBar, nestedPercentage, nestedStyle;

		const remainStyle = {
			height: remainFloor + '%',
		};

		sections.push(
			<div key="spacer" className={ classNames( spacerClassOptions ) } style={ remainStyle } />
		);

		const valueStyle = {
			top: remainFloor + '%',
		};

		if ( nestedValue ) {
			nestedPercentage = value ? Math.ceil( ( nestedValue / value ) * 10000 ) / 100 : 0;

			nestedStyle = { height: nestedPercentage + '%' };

			nestedBar = (
				<div key="nestedValue" className="dops-chart__bar-section-inner" style={ nestedStyle } />
			);
		}

		sections.push(
			<div
				ref="valueBar"
				key="value"
				className="dops-chart__bar-section is-bar"
				style={ valueStyle }
			>
				{ nestedBar }
			</div>
		);

		sections.push(
			<div key="label" className="dops-chart__bar-label">
				{ this.props.label }
			</div>
		);

		return sections;
	};

	clickHandler = () => {
		if ( 'function' === typeof this.props.clickHandler ) {
			this.props.clickHandler( this.props.data );
		}
	};

	mouseEnter = () => {
		this.setState( { showPopover: true } );
	};

	mouseLeave = () => {
		this.setState( { showPopover: false } );
	};

	renderTooltip = () => {
		if (
			! this.props.data.tooltipData ||
			! this.props.data.tooltipData.length ||
			this.props.isTouch
		) {
			return null;
		}

		const { tooltipData } = this.props.data;

		const listItemElements = tooltipData.map( function( options, i ) {
			const wrapperClasses = [ 'module-content-list-item' ];
			let gridiconSpan;

			if ( options.icon ) {
				gridiconSpan = <Gridicon icon={ options.icon } size={ 18 } />;
			}

			wrapperClasses.push( options.className );

			return (
				<li key={ i } className={ wrapperClasses.join( ' ' ) }>
					<span className="dops-wrapper">
						<span className="value">{ options.value }</span>
						<span className="label">
							{ gridiconSpan }
							{ options.label }
						</span>
					</span>
				</li>
			);
		} );

		return (
			<Tooltip
				className="dops-chart__tooltip"
				id="popover__chart-bar"
				showDelay={ 200 }
				context={ this.refs && this.refs.valueBar }
				isVisible={ this.state.showPopover }
				position={ this.props.tooltipPosition }
			>
				<ul>{ listItemElements }</ul>
			</Tooltip>
		);
	};

	render() {
		const count = this.props.count || 1;
		const barClass = { 'dops-chart__bar': true };

		if ( this.props.className ) {
			barClass[ this.props.className ] = true;
		}

		const barStyle = {
			width: ( 1 / count ) * 100 + '%',
		};

		return (
			<div
				role="button"
				tabIndex={ 0 }
				onClick={ this.clickHandler }
				onMouseEnter={ this.mouseEnter }
				onMouseLeave={ this.mouseLeave }
				className={ classNames( barClass ) }
				style={ barStyle }
			>
				{ this.buildSections() }
				<div className="dops-chart__bar-marker is-hundred" />
				<div className="dops-chart__bar-marker is-fifty" />
				<div className="dops-chart__bar-marker is-zero" />
				{ this.renderTooltip() }
			</div>
		);
	}
}
