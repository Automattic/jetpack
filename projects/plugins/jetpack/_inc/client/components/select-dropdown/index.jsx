/** @ssr-ready **/

import clsx from 'clsx';
import Count from 'components/count';
import DropdownItem from 'components/select-dropdown/item';
import DropdownLabel from 'components/select-dropdown/label';
import DropdownSeparator from 'components/select-dropdown/separator';
import { filter, find, findIndex, map, result } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import './style.scss';

/**
 * Module variables
 */
const { Component } = React;
const noop = () => {};

/**
 * SelectDropdown
 */

class SelectDropdown extends Component {
	itemRefs = {};
	dropdownContainerRef = React.createRef();

	constructor( props ) {
		super( props );

		// bounds
		this.navigateItem = this.navigateItem.bind( this );
		this.toggleDropdown = this.toggleDropdown.bind( this );
		this.handleOutsideClick = this.handleOutsideClick.bind( this );
		this._onClick = this._onClick.bind( this );

		// state
		const initialState = { isOpen: false };

		if ( props.options.length ) {
			initialState.selected = this.getInitialSelectedItem( props );
		}

		this.state = initialState;
	}

	UNSAFE_componentWillMount() {
		this.setState( {
			instanceId: ++SelectDropdown.instances,
		} );
	}

	UNSAFE_componentWillReceiveProps( nextProps ) {
		if ( this.state.isOpen ) {
			this.closeDropdown();
		}

		if (
			typeof this.state.selected !== 'undefined' &&
			this.props.initialSelected !== nextProps.initialSelected
		) {
			this.setState( { selected: nextProps.initialSelected } );
		}
	}

	componentWillUnmount() {
		window.removeEventListener( 'click', this.handleOutsideClick );
	}

	componentDidUpdate( prevProps, prevState ) {
		if ( this.state.isOpen ) {
			window.addEventListener( 'click', this.handleOutsideClick );
		} else {
			window.removeEventListener( 'click', this.handleOutsideClick );
		}

		if ( this.state.isOpen !== prevState.isOpen ) {
			this.props.onToggle( {
				target: this,
				open: this.state.isOpen,
			} );
		}
	}

	getInitialSelectedItem( props ) {
		props = props || this.props;

		if ( props.initialSelected ) {
			return props.initialSelected;
		}

		if ( ! props.options.length ) {
			return;
		}

		const selectedItem = find( props.options, value => ! value.isLabel );
		return selectedItem && selectedItem.value;
	}

	dropdownOptions() {
		let refIndex = 0;
		const self = this;

		if ( this.props.children ) {
			// add keys and refs to children
			return React.Children.map(
				this.props.children,
				function ( child, index ) {
					if ( ! child ) {
						return null;
					}

					self.itemRefs[ 'item-' + refIndex ] =
						child.type === DropdownItem ? React.createRef() : undefined;
					const newChild = React.cloneElement( child, {
						ref: self.itemRefs[ 'item-' + refIndex ],
						key: 'item-' + index,
						onClick: function ( event ) {
							self.dropdownContainerRef.current.focus();
							if ( typeof child.props.onClick === 'function' ) {
								child.props.onClick( event );
							}
						},
					} );

					if ( child.type === DropdownItem ) {
						refIndex++;
					}

					return newChild;
				},
				this
			);
		}

		return this.props.options.map( function ( item, index ) {
			if ( ! item ) {
				return (
					<DropdownSeparator key={ 'dropdown-separator-' + this.state.instanceId + '-' + index } />
				);
			}

			if ( item.isLabel ) {
				return (
					<DropdownLabel key={ 'dropdown-label-' + this.state.instanceId + '-' + index }>
						{ item.label }
					</DropdownLabel>
				);
			}

			self.itemRefs[ 'item-' + refIndex ] = React.createRef();
			const dropdownItem = (
				<DropdownItem
					key={ 'dropdown-item-' + this.state.instanceId + '-' + item.value }
					ref={ self.itemRefs[ 'item-' + refIndex ] }
					selected={ this.state.selected === item.value }
					onClick={ this.onSelectItem( item ) }
					path={ item.path }
				>
					{ item.label }
				</DropdownItem>
			);

			refIndex++;

			return dropdownItem;
		}, this );
	}

	render() {
		const dropdownClasses = {
			'dops-select-dropdown': true,
			'is-compact': this.props.compact,
			'is-open': this.state.isOpen,
			'is-disabled': this.props.disabled,
			'is-rna': this.props.rna,
		};

		if ( this.props.className ) {
			this.props.className.split( ' ' ).forEach( function ( className ) {
				dropdownClasses[ className ] = true;
			} );
		}

		const dropdownClassName = clsx( dropdownClasses );
		const selectedText = this.props.selectedText
			? this.props.selectedText
			: result( find( this.props.options, { value: this.state.selected } ), 'label' );

		return (
			<div style={ this.props.style } className={ dropdownClassName }>
				<div
					ref={ this.dropdownContainerRef }
					className="dops-select-dropdown__container"
					tabIndex={ this.props.tabIndex || 0 }
					role="listbox"
					aria-labelledby={ 'select-dropdown-' + this.state.instanceId }
					aria-owns={ 'select-submenu-' + this.state.instanceId }
					aria-controls={ 'select-submenu-' + this.state.instanceId }
					aria-expanded={ this.state.isOpen }
					onClick={ this._onClick }
					onKeyDown={ this.navigateItem }
				>
					<div
						id={ 'select-dropdown-' + this.state.instanceId }
						className="dops-select-dropdown__header"
					>
						<span className="dops-select-dropdown__header-text">
							{ selectedText }
							{ 'number' === typeof this.props.selectedCount && (
								<Count count={ this.props.selectedCount } />
							) }
						</span>
					</div>

					<ul
						id={ 'select-submenu-' + this.state.instanceId }
						className="dops-select-dropdown__options"
					>
						{ this.dropdownOptions() }
					</ul>
				</div>
			</div>
		);
	}

	_onClick() {
		if ( ! this.props.disabled ) {
			this.toggleDropdown();
		}
	}

	toggleDropdown() {
		this.setState( {
			isOpen: ! this.state.isOpen,
		} );
	}

	openDropdown() {
		this.setState( {
			isOpen: true,
		} );
	}

	closeDropdown() {
		if ( this.state.isOpen ) {
			delete this.focused;
			this.setState( {
				isOpen: false,
			} );
		}
	}

	onSelectItem( option ) {
		return this.selectItem.bind( this, option );
	}

	selectItem( option ) {
		if ( ! option ) {
			return;
		}

		if ( this.props.onSelect ) {
			this.props.onSelect( option );
		}

		this.setState( {
			selected: option.value,
		} );

		this.dropdownContainerRef.current.focus();
	}

	navigateItem( event ) {
		switch ( event.keyCode ) {
			case 9: //tab
				this.navigateItemByTabKey( event );
				break;
			case 32: // space
			case 13: // enter
				event.preventDefault();
				this.activateItem();
				break;
			case 38: // up arrow
				event.preventDefault();
				this.focusSibling( 'previous' );
				this.openDropdown();
				break;
			case 40: // down arrow
				event.preventDefault();
				this.focusSibling( 'next' );
				this.openDropdown();
				break;
			case 27: // escape
				event.preventDefault();
				this.closeDropdown();
				this.dropdownContainerRef.current.focus();
				break;
		}
	}

	navigateItemByTabKey( event ) {
		if ( ! this.state.isOpen ) {
			return;
		}
		event.preventDefault();
		const direction = event.shiftKey ? 'previous' : 'next';
		this.focusSibling( direction );
	}

	activateItem() {
		if ( ! this.state.isOpen ) {
			return this.openDropdown();
		}
		document.activeElement.click();
	}

	focusSibling( direction ) {
		let items, focusedIndex;

		// the initial up-arrow/down-arrow should only open the menu
		if ( ! this.state.isOpen ) {
			return;
		}

		if ( this.props.options.length ) {
			items = map(
				filter( this.props.options, item => {
					return item && ! item.isLabel;
				} ),
				'value'
			);

			focusedIndex =
				typeof this.focused === 'number' ? this.focused : items.indexOf( this.state.selected );
		} else {
			items = filter( this.props.children, function ( item ) {
				return item.type === DropdownItem;
			} );

			focusedIndex =
				typeof this.focused === 'number'
					? this.focused
					: findIndex( items, function ( item ) {
							return item.props.selected;
					  } );
		}

		const increment = direction === 'previous' ? -1 : 1;
		const newIndex = focusedIndex + increment;

		if ( newIndex >= items.length || newIndex < 0 ) {
			return;
		}

		this.itemRefs[ 'item-' + newIndex ].current.itemLinkRef.current.focus();
		this.focused = newIndex;
	}

	handleOutsideClick( event ) {
		if ( ! this.dropdownContainerRef.current.contains( event.target ) ) {
			this.closeDropdown();
		}
	}
}

SelectDropdown.defaultProps = {
	options: [],
	onSelect: noop,
	onToggle: noop,
	disabled: false,
	style: {},
	rna: false,
};

SelectDropdown.propTypes = {
	selectedText: PropTypes.string,
	selectedCount: PropTypes.number,
	initialSelected: PropTypes.string,
	className: PropTypes.string,
	style: PropTypes.object,
	onSelect: PropTypes.func,
	onToggle: PropTypes.func,
	focusSibling: PropTypes.func,
	tabIndex: PropTypes.number,
	disabled: PropTypes.bool,
	options: PropTypes.arrayOf(
		PropTypes.shape( {
			value: PropTypes.string.isRequired,
			label: PropTypes.string.isRequired,
			path: PropTypes.string,
		} )
	),
	rna: PropTypes.bool,
};

// statics
SelectDropdown.instances = 0;

export default SelectDropdown;
