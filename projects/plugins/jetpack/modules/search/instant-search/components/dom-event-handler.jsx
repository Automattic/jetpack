/**
 * External dependencies
 */
import { Component } from 'react';
// NOTE: We only import the debounce function here for reduced bundle size.
//       Do not import the entire lodash library!
// eslint-disable-next-line lodash/import-scope
import debounce from 'lodash/debounce';

// This component is used primarily to bind DOM event handlers to elements outside of the Jetpack Search overlay.
export default class DomEventHandler extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			// When typing in CJK, the following events fire in order:
			// keydown, compositionstart, compositionupdate, input, keyup, keydown,compositionend, keyup
			// We toggle isComposing on compositionstart and compositionend events.
			// (CJK = Chinese, Japanese, Korean; see https://en.wikipedia.org/wiki/CJK_characters)
			isComposing: false,
			// `bodyScrollTop` remembers the body scroll position.
			bodyScrollTop: 0,
			previousStyle: null,
			previousBodyStyleAttribute: '',
		};
		this.props.initializeQueryValues();
	}

	componentDidMount() {
		this.disableUnnecessaryFormAndInputAttributes();
		this.addEventListeners();
	}

	componentWillUnmount() {
		this.removeEventListeners();
		this.restoreBodyScroll();
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.isVisible !== prevProps.isVisible ) {
			this.fixBodyScroll();
		}
	}

	disableUnnecessaryFormAndInputAttributes() {
		// Disables the following attributes:
		// - autocomplete - leads to poor UX.
		// - required - prevents Instant Search from spawning in certain scenarios.
		document.querySelectorAll( this.props.themeOptions.searchInputSelector ).forEach( input => {
			input.removeAttribute( 'required' );
			input.removeAttribute( 'autocomplete' );
			input.form.removeAttribute( 'autocomplete' );
		} );
	}

	addEventListeners() {
		window.addEventListener( 'popstate', this.handleHistoryNavigation );

		// Add listeners for input and submit
		document.querySelectorAll( this.props.themeOptions.searchInputSelector ).forEach( input => {
			input.form.addEventListener( 'submit', this.handleSubmit );
			// keydown handler is causing text duplication because it actively sets the search input
			// value after system input method empty the input but before filling the input again.
			// so changed to keyup event which is fired after compositionend when Enter is pressed.
			input.addEventListener( 'keyup', this.handleKeyup );
			input.addEventListener( 'input', this.handleInput );
			input.addEventListener( 'compositionstart', this.handleCompositionStart );
			input.addEventListener( 'compositionend', this.handleCompositionEnd );
		} );

		document.querySelectorAll( this.props.themeOptions.overlayTriggerSelector ).forEach( button => {
			button.addEventListener( 'click', this.handleOverlayTriggerClick, true );
		} );

		document.querySelectorAll( this.props.themeOptions.filterInputSelector ).forEach( element => {
			element.addEventListener( 'click', this.handleFilterInputClick );
		} );
	}

	removeEventListeners() {
		window.removeEventListener( 'popstate', this.handleHistoryNavigation );

		document.querySelectorAll( this.props.themeOptions.searchInputSelector ).forEach( input => {
			input.form.removeEventListener( 'submit', this.handleSubmit );
			input.removeEventListener( 'keyup', this.handleKeyup );
			input.removeEventListener( 'input', this.handleInput );
			input.removeEventListener( 'compositionstart', this.handleCompositionStart );
			input.removeEventListener( 'compositionend', this.handleCompositionEnd );
		} );

		document.querySelectorAll( this.props.themeOptions.overlayTriggerSelector ).forEach( button => {
			button.removeEventListener( 'click', this.handleOverlayTriggerClick, true );
		} );

		document.querySelectorAll( this.props.themeOptions.filterInputSelector ).forEach( element => {
			element.removeEventListener( 'click', this.handleFilterInputClick );
		} );
	}

	handleCompositionStart = () => this.setState( { isComposing: true } );
	handleCompositionEnd = () => this.setState( { isComposing: false } );

	handleFilterInputClick = event => {
		event.preventDefault();
		if ( event.currentTarget.dataset.filterType ) {
			if ( event.currentTarget.dataset.filterType === 'taxonomy' ) {
				this.props.setFilter(
					event.currentTarget.dataset.taxonomy,
					event.currentTarget.dataset.val
				);
			} else {
				this.props.setFilter(
					event.currentTarget.dataset.filterType,
					event.currentTarget.dataset.val
				);
			}
		}
		this.props.setSearchQuery( '' );
		this.props.showResults();
	};

	handleHistoryNavigation = () => {
		// Treat history navigation as brand new query values; re-initialize.
		// Note that this re-initialization will trigger onChangeQueryString via side effects.
		this.props.initializeQueryValues( { isHistoryNavigation: true } );
	};

	handleInput = debounce( event => {
		// Reference: https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes
		// NOTE: inputType is not compatible with IE11, so we use optional chaining here. https://caniuse.com/mdn-api_inputevent_inputtype
		if ( event.inputType?.includes( 'format' ) || event.target.value === '' ) {
			return;
		}

		// Is the user still composing input with a CJK language?
		if ( this.state.isComposing ) {
			return;
		}

		if ( this.props.overlayOptions.overlayTrigger === 'submit' ) {
			return;
		}

		this.props.setSearchQuery( event.target.value );

		if ( this.props.overlayOptions.overlayTrigger === 'immediate' ) {
			this.props.showResults();
		}

		if ( this.props.overlayOptions.overlayTrigger === 'results' ) {
			this.props.response?.results && this.props.showResults();
		}
	}, 200 );

	handleKeyup = event => {
		// If user presses enter, propagate the query value and immediately show the results.
		if ( event.key === 'Enter' ) {
			this.props.setSearchQuery( event.target.value );
			this.props.showResults();
		}
	};

	// Treat overlay trigger clicks to be equivalent to setting an empty string search query.
	handleOverlayTriggerClick = event => {
		event.stopImmediatePropagation();
		this.props.setSearchQuery( '' );
		this.props.showResults();
	};

	handleSubmit = event => {
		event.preventDefault();
		this.handleInput.flush();

		// handleInput didn't respawn the overlay. Do it manually -- form submission must spawn an overlay.
		if ( ! this.props.isVisible ) {
			const value = event.target.querySelector( this.props.themeOptions.searchInputSelector )
				?.value;
			// Don't do a falsy check; empty string is an allowed value.
			typeof value === 'string' && this.props.setSearchQuery( value );
			this.props.showResults();
		}
	};

	fixBodyScroll = () => {
		if ( this.props.isVisible ) {
			this.preventBodyScroll();
			// This ensures the search input is visible on mobile devices.
			// @see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTo
			window?.scrollTo( 0, 0 );
		} else if ( ! this.props.isVisible ) {
			this.restoreBodyScroll();
		}
	};

	/**
	 * 1) When the overlay is open, we set body to fixed position.
	 * 2) Body would be scrolled to top, so we need to set top to where the scroll position was.
	 * 3) And we remember the body postition in `this.state.bodyScrollTop`
	 */
	preventBodyScroll() {
		this.setState(
			{
				bodyScrollTop: parseInt( window.scrollY ) || 0,
				previousStyle: {
					top: document.body.style.top,
					left: document.body.style.left,
					right: document.body.style.right,
					scrollBehavior: document.documentElement.style.scrollBehavior,
				},
				previousBodyStyleAttribute: document.body.getAttribute( 'style' ),
			},
			() => {
				/**
				 * For logged-in user, there's a WP Admin Bar which is made sticky by adding `margin-top` to the document (the old way of `position: sticky;`).
				 * So we need to fix the offset of scrollY for fixed positioned body.
				 */
				const scrollYOffset =
					document.documentElement?.scrollHeight - document.body?.scrollHeight || 0;
				// This is really important - e.g. `twentytwenty` set an important style to body which we'd need to override.
				// Make body not scrollable.
				document.body.setAttribute( 'style', 'position: fixed !important' );

				// Keep body at the same position when overlay is open.
				document.body.style.top = `-${ this.state.bodyScrollTop - scrollYOffset }px`;
				// Make body in the center.
				document.body.style.left = 0;
				document.body.style.right = 0;
			}
		);
	}

	/**
	 * 1) Unset body fixed postion
	 * 2) Scroll back to the `this.state.bodyScrollTop`
	 * 3) Reset `this.state.bodyScrollTop` to `0`
	 */
	restoreBodyScroll() {
		// Restore body style attribute.
		if ( this.state.previousBodyStyleAttribute ) {
			document.body.setAttribute( 'style', this.state.previousBodyStyleAttribute );
		} else {
			document.body.removeAttribute( 'style' );
		}
		// Restore body style object.
		document.body.style.top = this.state.previousStyle?.top ?? '';
		document.body.style.left = this.state.previousStyle?.left ?? '';
		document.body.style.right = this.state.previousStyle?.right ?? '';
		// Prevent smooth scroll etc if there's any.
		document.documentElement.style.scrollBehavior = 'revert';
		// Restore body position.
		this.state.bodyScrollTop > 0 && window.scrollTo( 0, this.state.bodyScrollTop );
		document.documentElement.style.scrollBehavior = this.state.previousStyle?.scrollBehavior ?? '';

		//Restore states.
		this.setState( {
			bodyScrollTop: 0,
			previousStyle: null,
			previousBodyStyleAttribute: '',
		} );
	}

	render() {
		return null;
	}
}
