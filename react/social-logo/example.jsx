/* eslint-disable no-alert */
/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import SocialLogo from 'components/social-logo';

export default React.createClass( {
	displayName: 'SocialIcon',

	handleClick( icon ) {
		const toCopy = '<SocialLogo icon="' + icon + '" />';
		window.prompt( 'Copy component code:', toCopy );
	},

	render() {
		return (
			<div className="design-assets__group">
				<h2><a href="/devdocs/design/social-logo">Social Logo</a></h2>
				<SocialLogo icon="logo-blogger-alt" size={ 48 } onClick={ this.handleClick.bind( this, 'logo-blogger-alt' ) } />
				<SocialLogo icon="logo-blogger" size={ 48 } onClick={ this.handleClick.bind( this, 'logo-blogger' ) } />
				<SocialLogo icon="logo-eventbrite" size={ 48 } onClick={ this.handleClick.bind( this, 'logo-eventbrite' ) } />
				<SocialLogo icon="logo-facebook" size={ 48 } onClick={ this.handleClick.bind( this, 'logo-facebook' ) } />
				<SocialLogo icon="logo-google-plus-alt" size={ 48 } onClick={ this.handleClick.bind( this, 'logo-google-plus-alt' ) } />
				<SocialLogo icon="logo-google-plus" size={ 48 } onClick={ this.handleClick.bind( this, 'logo-google-plus' ) } />
				<SocialLogo icon="logo-linkedin" size={ 48 } onClick={ this.handleClick.bind( this, 'logo-linkedin' ) } />
				<SocialLogo icon="logo-path-alt" size={ 48 } onClick={ this.handleClick.bind( this, 'logo-path-alt' ) } />
				<SocialLogo icon="logo-path" size={ 48 } onClick={ this.handleClick.bind( this, 'logo-path' ) } />
				<SocialLogo icon="logo-pinterest-alt" size={ 48 } onClick={ this.handleClick.bind( this, 'logo-pinterest-alt' ) } />
				<SocialLogo icon="logo-pinterest" size={ 48 } onClick={ this.handleClick.bind( this, 'logo-pinterest' ) } />
				<SocialLogo icon="logo-pocket" size={ 48 } onClick={ this.handleClick.bind( this, 'logo-pocket' ) } />
				<SocialLogo icon="logo-reddit" size={ 48 } onClick={ this.handleClick.bind( this, 'logo-reddit' ) } />
				<SocialLogo icon="logo-squarespace" size={ 48 } onClick={ this.handleClick.bind( this, 'logo-squarespace' ) } />
				<SocialLogo icon="logo-tumblr-alt" size={ 48 } onClick={ this.handleClick.bind( this, 'logo-tumblr-alt' ) } />
				<SocialLogo icon="logo-tumblr" size={ 48 } onClick={ this.handleClick.bind( this, 'logo-tumblr' ) } />
				<SocialLogo icon="logo-twitter" size={ 48 } onClick={ this.handleClick.bind( this, 'logo-twitter' ) } />
				<SocialLogo icon="logo-wordpress" size={ 48 } onClick={ this.handleClick.bind( this, 'logo-wordpress' ) } />
				<SocialLogo icon="logo-xanga" size={ 48 } onClick={ this.handleClick.bind( this, 'logo-xanga' ) } />
			</div>
		);
	}
} );
