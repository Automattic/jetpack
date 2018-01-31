/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import noop from 'lodash/noop';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import Gridicon from 'components/gridicon';
import onKeyDownCallback from 'utils/onkeydown-callback';
import { imagePath } from 'constants/urls';

class JetpackDialogue extends Component {
	maybeDismiss( e ) {
		if ( this.props.showDismiss ) {
			this.props.dismiss( e );
		}
	}

	// capture the ESC key globally
	componentDidMount(){
		document.addEventListener( 'keydown', this.maybeDismiss, false );
	}

	componentWillUnmount(){
		document.removeEventListener( 'keydown', this.maybeDismiss, false );
	}

	// prevent foreground clicks going through to the background
	clickForeground( e ) {
		e.stopPropagation();
	}

	render() {
		const classes = classNames(
			this.props.className,
			'jp-dialogue'
		);
		return (
			<div className="jp-dialogue-full__container" onClick={ this.maybeDismiss.bind( this ) }>
				<img src={ imagePath + 'stars-full.svg' } width="60" height="60" alt={ __( 'Stars' ) } className="jp-jumpstart-full__svg-stars" />
				<img src={ imagePath + 'jupiter.svg' } width="50" height="100" alt={ __( 'Jupiter' ) } className="jp-jumpstart-full__svg-jupiter" />

				<div className={ classes } onClick={ this.clickForeground.bind( this ) }>
					{ this.props.svg }

					<h1 className="jp-dialogue__title">
						{ this.props.title }
					</h1>

					<Card>
						{
							this.props.showDismiss && <Gridicon
								icon="cross-circle"
								className="jp-dialogue-full__dismiss"
								tabIndex="0"
								onKeyDown={ onKeyDownCallback( this.props.dismiss ) }
								onClick={ this.props.dismiss }
							/>
						}
						{ this.props.content }
					</Card>
					<div>
						{ this.props.belowContent }
					</div>
				</div>
			</div>
		);
	}
}

JetpackDialogue.propTypes = {
	content: PropTypes.oneOfType( [
		PropTypes.string,
		PropTypes.object,
	] ).isRequired,
	belowContent: PropTypes.oneOfType( [
		PropTypes.string,
		PropTypes.object,
	] ).isRequired,
	svg: PropTypes.oneOfType( [
		PropTypes.bool,
		PropTypes.object,
	] ),
	dismissOnClick: PropTypes.func,
	showDismiss: PropTypes.bool,
	title: PropTypes.string
};

JetpackDialogue.defaultProps = {
	svg: false,
	showDismiss: true,
	dismiss: noop,
	content: '',
	belowContent: '',
	title: '',
};

export default JetpackDialogue;
