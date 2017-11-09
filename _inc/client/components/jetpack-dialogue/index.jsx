/**
 * External dependencies
 */
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
	render() {
		const classes = classNames(
			this.props.className,
			'jp-dialogue'
		);
		return (
			<div className="jp-dialogue-full__container">
				<img src={ imagePath + 'stars-full.svg' } width="60" height="60" alt={ __( 'Stars' ) } className="jp-jumpstart-full__svg-stars" />
				<img src={ imagePath + 'jupiter.svg' } width="50" height="100" alt={ __( 'Jupiter' ) } className="jp-jumpstart-full__svg-jupiter" />
				{
					this.props.showDismiss && <Gridicon
						icon="cross-small"
						className="jp-dialogue-full__dismiss"
						tabIndex="0"
						onKeyDown={ onKeyDownCallback( this.props.dismiss ) }
						onClick={ this.props.dismiss }
					/>
				}

				<div className={ classes }>
					{ this.props.svg }

					<h1 className="jp-dialogue__title">
						{ this.props.title }
					</h1>

					<Card>
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
	content: React.PropTypes.oneOfType( [
		React.PropTypes.string,
		React.PropTypes.object,
	] ).isRequired,
	belowContent: React.PropTypes.oneOfType( [
		React.PropTypes.string,
		React.PropTypes.object,
	] ).isRequired,
	svg: React.PropTypes.oneOfType( [
		React.PropTypes.bool,
		React.PropTypes.object,
	] ),
	dismissOnClick: React.PropTypes.func,
	showDismiss: React.PropTypes.bool,
	title: React.PropTypes.string
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
