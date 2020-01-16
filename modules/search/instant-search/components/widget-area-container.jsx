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

export default class WidgetAreaContainer extends Component {
	container = createRef();

	componentDidMount() {
		const widgetArea = document.getElementsByClassName(
			'jetpack-instant-search__widget-area'
		)[ 0 ];

		if ( widgetArea ) {
			widgetArea.style.removeProperty( 'display' );
			this.container.current.appendChild( widgetArea );
		}
	}

	shouldComponentUpdate() {
		return false;
	}

	render() {
		return (
			<div className="jetpack-instant-search__widget-area-container" ref={ this.container }></div>
		);
	}
}
