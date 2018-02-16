/**
 * External Dependencies
 */
const PropTypes = require( 'prop-types' );
const React = require( 'react' ),
	classNames = require( 'classnames' );

/**
 * Internal Dependencies
 */
const SegmentedControl = require( 'components/segmented-control' ),
	ControlItem = require( 'components/segmented-control/item' );

/**
 * Internal variables
 */
let _instance = 1;

class NavSegmented extends React.Component {
	static propTypes = {
		label: PropTypes.string,
		hasSiblingControls: PropTypes.bool
	};

	static defaultProps = {
		hasSiblingControls: false
	};

	componentWillMount() {
		this.id = _instance;
		_instance++;
	}

	render() {
		const segmentedClassName = classNames( {
			'dops-section-nav-group': true,
			'dops-section-nav__segmented': true,
			'has-siblings': this.props.hasSiblingControls
		} );

		return (
			<div className={ segmentedClassName }>
				{
					this.props.label &&
					<h6 className="dops-section-nav-group__label">{ this.props.label }</h6>
				}

				<SegmentedControl>
					{ this.getControlItems() }
				</SegmentedControl>
			</div>
		);
	}

	getControlItems = () => {
		return React.Children.map( this.props.children, function( child, index ) {
			return (
				<ControlItem
					{ ...child.props }
					key={ 'navSegmented-' + this.id + '-' + index }
				>
					{ child.props.children }
				</ControlItem>
			);
		}, this );
	};
}

module.exports = NavSegmented;
