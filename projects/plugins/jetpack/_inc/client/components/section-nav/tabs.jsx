/** @ssr-ready **/

import { getWindowInnerWidth } from '@automattic/viewport';
import clsx from 'clsx';
import SelectDropdown from 'components/select-dropdown';
import DropdownItem from 'components/select-dropdown/item';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Internal Variables
 */
const MOBILE_PANEL_THRESHOLD = 660;

class NavTabs extends React.Component {
	static propTypes = {
		selectedText: PropTypes.string,
		selectedCount: PropTypes.number,
		label: PropTypes.string,
		hasSiblingControls: PropTypes.bool,
	};

	static defaultProps = {
		hasSiblingControls: false,
	};

	navGroupRef = React.createRef();
	tabRefs = {};

	state = {
		isDropdown: false,
	};

	componentDidMount() {
		this.setDropdown();
		this.debouncedAfterResize = debounce( this.setDropdown, 300 );

		window.addEventListener( 'resize', this.debouncedAfterResize );
	}

	UNSAFE_componentWillReceiveProps() {
		this.setDropdown();
	}

	componentWillUnmount() {
		window.removeEventListener( 'resize', this.debouncedAfterResize );
	}

	render() {
		const self = this;
		const tabs = React.Children.map( this.props.children, function ( child, index ) {
			self.tabRefs[ 'tab-' + index ] = React.createRef();
			return child && React.cloneElement( child, { ref: self.tabRefs[ 'tab-' + index ] } );
		} );

		const tabsClassName = clsx( {
			'dops-section-nav-tabs': true,
			'is-dropdown': this.state.isDropdown,
			'is-open': this.state.isDropdownOpen,
			'has-siblings': this.props.hasSiblingControls,
		} );

		const innerWidth = getWindowInnerWidth();

		return (
			<div className="dops-section-nav-group" ref={ this.navGroupRef }>
				<div className={ tabsClassName }>
					{ this.props.label && (
						<h6 className="dops-section-nav-group__label">{ this.props.label }</h6>
					) }
					<ul className="dops-section-nav-tabs__list" role="menu" onKeyDown={ this.keyHandler }>
						{ tabs }
					</ul>

					{ this.state.isDropdown && innerWidth > MOBILE_PANEL_THRESHOLD && this.getDropdown() }
				</div>
			</div>
		);
	}

	getTabWidths = () => {
		const self = this;
		let totalWidth = 0;

		React.Children.forEach(
			this.props.children,
			function ( child, index ) {
				if ( ! child ) {
					return;
				}
				const tabWidth = self.tabRefs[ 'tab-' + index ].current.domNode.offsetWidth;
				totalWidth += tabWidth;
			}.bind( this )
		);

		this.tabsWidth = totalWidth;
	};

	getDropdown = () => {
		const dropdownOptions = React.Children.map( this.props.children, function ( child, index ) {
			if ( ! child ) {
				return null;
			}
			return (
				<DropdownItem { ...child.props } key={ 'navTabsDropdown-' + index }>
					{ child.props.children }
				</DropdownItem>
			);
		} );

		return (
			<SelectDropdown
				className="dops-section-nav-tabs__dropdown"
				selectedText={ this.props.selectedText }
				selectedCount={ this.props.selectedCount }
			>
				{ dropdownOptions }
			</SelectDropdown>
		);
	};

	setDropdown = () => {
		let navGroupWidth;

		if ( window.innerWidth > MOBILE_PANEL_THRESHOLD ) {
			if ( ! this.navGroupRef.current ) {
				return;
			}

			navGroupWidth = this.navGroupRef.current.offsetWidth;

			if ( ! this.tabsWidth ) {
				this.getTabWidths();
			}

			if ( navGroupWidth <= this.tabsWidth && ! this.state.isDropdown ) {
				this.setState( {
					isDropdown: true,
				} );
			} else if ( navGroupWidth > this.tabsWidth && this.state.isDropdown ) {
				this.setState( {
					isDropdown: false,
				} );
			}
		} else if ( window.innerWidth <= MOBILE_PANEL_THRESHOLD && this.state.isDropdown ) {
			this.setState( {
				isDropdown: false,
			} );
		}
	};

	keyHandler = event => {
		switch ( event.keyCode ) {
			case 32: // space
			case 13: // enter
				event.preventDefault();
				document.activeElement.click();
				break;
		}
	};
}

export default NavTabs;
