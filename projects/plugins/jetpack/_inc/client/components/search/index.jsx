import { isMobile } from '@automattic/viewport';
import clsx from 'clsx';
import Gridicon from 'components/gridicon';
import analytics from 'lib/analytics';
import { debounce, noop } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import SearchClearButton from './clear-btn';
import SearchCloseButton from './close-btn';

import './style.scss';

/**
 * Internal variables
 */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Listener for key events
 *
 * @param {Function} methodToCall - Method to call
 * @param {Event}    event        - Event
 */
function keyListener( methodToCall, event ) {
	switch ( event.key ) {
		case ' ':
		case 'Enter':
			this[ methodToCall ]( event );
			break;
	}
}

class Search extends React.Component {
	static displayName = 'Search';
	static instances = 0;

	static propTypes = {
		additionalClasses: PropTypes.string,
		initialValue: PropTypes.string,
		placeholder: PropTypes.string,
		pinned: PropTypes.bool,
		delaySearch: PropTypes.bool,
		delayTimeout: PropTypes.number,
		onSearch: PropTypes.func.isRequired,
		onSearchChange: PropTypes.func,
		onSearchOpen: PropTypes.func,
		analyticsGroup: PropTypes.string,
		overlayStyling: PropTypes.func,
		autoFocus: PropTypes.bool,
		disabled: PropTypes.bool,
		onKeyDown: PropTypes.func,
		onClick: PropTypes.func,
		disableAutocorrect: PropTypes.bool,
		onBlur: PropTypes.func,
		searching: PropTypes.bool,
		isOpen: PropTypes.bool,
		dir: PropTypes.oneOf( [ 'ltr', 'rtl' ] ),
		fitsContainer: PropTypes.bool,
		maxLength: PropTypes.number,
		hideClose: PropTypes.bool,
	};

	static defaultProps = {
		pinned: false,
		delaySearch: false,
		delayTimeout: SEARCH_DEBOUNCE_MS,
		autoFocus: false,
		disabled: false,
		onSearchChange: noop,
		onSearchOpen: noop,
		onKeyDown: noop,
		onClick: noop,
		//undefined value for overlayStyling is an optimization that will
		//disable overlay scrolling calculation when no overlay is provided.
		overlayStyling: undefined,
		disableAutocorrect: false,
		searching: false,
		isOpen: false,
		dir: undefined,
		fitsContainer: false,
		hideClose: false,
	};

	overlayRef = React.createRef();
	searchInputRef = React.createRef();
	openIconRef = React.createRef();

	state = {
		keyword: this.props.initialValue || '',
		isOpen: !! this.props.isOpen,
		hasFocus: false,
	};

	UNSAFE_componentWillMount() {
		this.setState( {
			instanceId: ++Search.instances,
		} );

		this.closeListener = keyListener.bind( this, 'closeSearch' );
		this.openListener = keyListener.bind( this, 'openSearch' );
	}

	UNSAFE_componentWillReceiveProps( nextProps ) {
		if (
			nextProps.onSearch !== this.props.onSearch ||
			nextProps.delaySearch !== this.props.delaySearch
		) {
			this.onSearch = this.props.delaySearch
				? debounce( this.props.onSearch, this.props.delayTimeout )
				: this.props.onSearch;
		}

		if (
			nextProps.initialValue !== this.props.initialValue &&
			( this.state.keyword === this.props.initialValue || this.state.keyword === '' )
		) {
			this.setState( { keyword: nextProps.initialValue || '' } );
		}
	}

	componentDidUpdate( prevProps, prevState ) {
		this.scrollOverlay();
		// Focus if the search box was opened or the autoFocus prop has changed
		if (
			( this.state.isOpen && ! prevState.isOpen ) ||
			( this.props.autoFocus && ! prevProps.autoFocus )
		) {
			this.focus();
		}

		if ( this.state.keyword === prevState.keyword ) {
			return;
		}
		// if there's a keyword change: trigger search
		if ( this.state.keyword ) {
			// this.onSearch is debounced when this.props.delaySearch === true
			// this avoids unnecessary fetches while user types
			this.onSearch( this.state.keyword );
		} else {
			// this.props.onSearch is _not_ debounced
			// no need to debounce if ! this.state.keyword
			if ( this.props.delaySearch ) {
				// Cancel any pending debounce
				this.onSearch.cancel();
			}
			this.props.onSearch( this.state.keyword );
		}
		this.props.onSearchChange( this.state.keyword );
	}

	componentDidMount() {
		this.onSearch = this.props.delaySearch
			? debounce( this.props.onSearch, this.props.delayTimeout )
			: this.props.onSearch;

		if ( this.props.autoFocus ) {
			// this hack makes autoFocus work correctly in Dropdown
			setTimeout( () => this.focus(), 0 );
		}
	}

	scrollOverlay = () => {
		this.overlayRef.current &&
			window.requestAnimationFrame( () => {
				if ( this.overlayRef.current && this.searchInputRef.current ) {
					this.overlayRef.current.scrollLeft = this.getScrollLeft( this.searchInputRef.current );
				}
			} );
	};

	//This is fix for IE11. Does not work on Edge.
	//On IE11 scrollLeft value for input is always 0.
	//We are calculating it manually using TextRange object.
	getScrollLeft = inputElement => {
		//TextRange is IE11 specific so this checks if we are not on IE11.
		if ( ! inputElement.createTextRange ) {
			return inputElement.scrollLeft;
		}

		const range = inputElement.createTextRange();
		const inputStyle = window.getComputedStyle( inputElement, undefined );
		const paddingLeft = parseFloat( inputStyle.paddingLeft );
		const rangeRect = range.getBoundingClientRect();
		const scrollLeft =
			inputElement.getBoundingClientRect().left +
			inputElement.clientLeft +
			paddingLeft -
			rangeRect.left;
		return scrollLeft;
	};

	focus = () => {
		// if we call focus before the element has been entirely synced up with the DOM, we stand a decent chance of
		// causing the browser to scroll somewhere odd. Instead, defer the focus until a future turn of the event loop.
		setTimeout( () => this.searchInputRef.current && this.searchInputRef.current.focus(), 0 );
	};

	blur = () => {
		this.searchInputRef.current.blur();
	};

	getCurrentSearchValue = () => {
		return this.searchInputRef.current.value;
	};

	clear = () => {
		this.setState( { keyword: '' } );
	};

	onBlur = event => {
		if ( this.props.onBlur ) {
			this.props.onBlur( event );
		}

		this.setState( { hasFocus: false } );
	};

	onChange = () => {
		this.setState( {
			keyword: this.getCurrentSearchValue(),
		} );
	};

	openSearch = event => {
		this.props.onClick();
		event.preventDefault();
		this.setState( {
			keyword: '',
			isOpen: true,
		} );

		analytics.ga.recordEvent( this.props.analyticsGroup, 'Clicked Open Search' );
	};

	closeSearch = event => {
		event.preventDefault();

		if ( this.props.disabled ) {
			return;
		}

		this.setState( {
			keyword: '',
			isOpen: false,
		} );

		if ( this.props.pinned ) {
			this.openIconRef.current.focus();
		}

		analytics.ga.recordEvent( this.props.analyticsGroup, 'Clicked Close Search' );
	};

	clearSearch = () => {
		this.clear();
		this.focus();
	};

	keyUp = event => {
		if ( event.key === 'Enter' && isMobile() ) {
			//dismiss soft keyboards
			this.blur();
		}

		if ( ! this.props.pinned ) {
			return;
		}

		if ( event.key === 'Escape' ) {
			this.closeSearch( event );
		}
		this.scrollOverlay();
	};

	keyDown = event => {
		this.scrollOverlay();
		if ( event.key === 'Escape' && event.target.value === '' ) {
			this.closeSearch( event );
		}
		this.props.onKeyDown( event );
	};

	// Puts the cursor at end of the text when starting
	// with `initialValue` set.
	onFocus = () => {
		const input = this.searchInputRef.current,
			setValue = input.value;

		if ( setValue ) {
			// Firefox needs clear or won't move cursor to end
			input.value = '';
			input.value = setValue;
		}

		this.setState( { hasFocus: true } );
		this.props.onSearchOpen();
	};

	render() {
		const searchValue = this.state.keyword;
		const placeholder = this.props.placeholder || 'Search…';

		const enableOpenIcon = this.props.pinned && ! this.state.isOpen;
		const isOpenUnpinnedOrQueried =
			this.state.isOpen || ! this.props.pinned || this.props.initialValue;

		const autocorrect = this.props.disableAutocorrect && {
			autoComplete: 'off',
			autoCorrect: 'off',
			spellCheck: 'false',
		};

		const searchClass = clsx( this.props.additionalClasses, this.props.dir, {
			'is-expanded-to-container': this.props.fitsContainer,
			'is-open': isOpenUnpinnedOrQueried,
			'is-searching': this.props.searching,
			'has-focus': this.state.hasFocus,
			'dops-search': true,
		} );

		const fadeDivClass = clsx( 'dops-search__input-fade', this.props.dir );
		const inputClass = clsx( 'dops-search__input', this.props.dir );
		const showCloseButton = ! this.props.hideClose && ( this.state.keyword || this.state.isOpen );
		const showClearButton = showCloseButton && searchValue;

		return (
			<div dir={ this.props.dir || null } className={ searchClass } role="search">
				<div
					role="button"
					className="dops-search__icon-navigation"
					ref={ this.openIconRef }
					onClick={ enableOpenIcon ? this.openSearch : this.focus }
					tabIndex={ enableOpenIcon ? '0' : null }
					onKeyDown={ enableOpenIcon ? this.openListener : null }
					aria-controls={ 'dops-search-component-' + this.state.instanceId }
					aria-label="Open Search"
				>
					<Gridicon icon="search" className="dops-search__open-icon" />
				</div>
				<div className={ fadeDivClass }>
					<input
						type="search"
						onChange={ this.onChange }
						id={ 'dops-search-component-' + this.state.instanceId }
						className={ inputClass }
						placeholder={ placeholder }
						role="searchbox"
						tabIndex={ isOpenUnpinnedOrQueried ? '0' : '-1' }
						value={ searchValue }
						ref={ this.searchInputRef }
						onKeyUp={ this.keyUp }
						onKeyDown={ this.keyDown }
						onMouseUp={ this.props.onClick }
						onFocus={ this.onFocus }
						onBlur={ this.onBlur }
						disabled={ this.props.disabled }
						aria-hidden={ ! isOpenUnpinnedOrQueried }
						autoCapitalize="none"
						dir={ this.props.dir }
						maxLength={ this.props.maxLength }
						{ ...autocorrect }
					/>
					{ this.props.overlayStyling && this.renderStylingDiv() }
				</div>
				{ showClearButton && <SearchClearButton onClick={ this.clearSearch } /> }
				{ showCloseButton && (
					<SearchCloseButton
						closeSearch={ this.closeSearch }
						closeListener={ this.closeListener }
						instanceId={ this.state.instanceId }
					/>
				) }
			</div>
		);
	}

	renderStylingDiv = () => {
		return (
			<div className="dops-search__text-overlay" ref={ this.overlayRef }>
				{ this.props.overlayStyling( this.state.keyword ) }
			</div>
		);
	};
}

export default Search;
