/** @jsx h */

/**
 * External dependencies
 */
import { h, Component, createRef } from 'preact';

// NOTE:
//
// We use Preact.Component instead of a Hooks based component because
// we need to set shouldComponentUpdate to always return false.
//
// We could implement such in a Hooks based component using React.memo,
// but doing so would require importing (and bloating the bundle with)
// preact/compat.

export default class SearchSidebar extends Component {
	sidebar = createRef();

	componentDidMount() {
		this.children = document.getElementsByClassName( 'jetpack-instant-search__widget-area' );
		[ ...this.children ].forEach( child => {
			child.style.removeProperty( 'display' );
			this.sidebar.current.appendChild( child );
		} );
	}

	shouldComponentUpdate() {
		return false;
	}

	render() {
		return <div className="jetpack-instant-search__sidebar" ref={ this.sidebar }></div>;
	}
}
