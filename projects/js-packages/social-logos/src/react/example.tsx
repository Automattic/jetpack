import React, { useState } from 'react';
import { SocialLogo } from './social-logo';
import { SocialLogoData } from './social-logo-data';
import './example.css';

/**
 * An example React component that displays all the social logos.
 *
 * @returns {React.Component} The `SocialLogosExample` component.
 */
function SocialLogosExample() {
	const [ useSmallIcons, setUseSmallIcons ] = useState( false );
	const [ showIconNames, setShowIconNames ] = useState( true );

	const iconSize = useSmallIcons ? 24 : 48;

	const handleClick = name => {
		const code = `<SocialLogo icon="${ name }" size="${ iconSize }" />`;
		window.prompt( 'Copy component code:', code );
	};

	const handleSmallIconsToggle = e => {
		setUseSmallIcons( e.target.checked );
	};

	const handleIconNamesToggle = e => {
		setShowIconNames( e.target.checked );
	};

	const allSocialLogos = SocialLogoData.map( logo => {
		return (
			<div key={ logo.name }>
				<SocialLogo
					icon={ logo.name }
					size={ iconSize }
					onClick={ handleClick.bind( this, logo.name ) }
				/>
				{ showIconNames && <p>{ logo.name }</p> }
			</div>
		);
	} );

	return (
		<div className="social-logos-example">
			<h1>Social Logos</h1>

			<div className="display-control-group">
				<div className="display-control">
					<h4>Small icons</h4>
					{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control -- https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/issues/869 */ }
					<label className="switch">
						<input type="checkbox" onChange={ handleSmallIconsToggle } checked={ useSmallIcons } />
						<span className="handle"></span>
					</label>
				</div>
				<div className="display-control">
					<h4>Icon names</h4>
					{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control -- https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/issues/869 */ }
					<label className="switch">
						<input type="checkbox" onChange={ handleIconNamesToggle } checked={ showIconNames } />
						<span className="handle"></span>
						<span className="switch-label" data-on="On" data-off="Off"></span>
					</label>
				</div>
			</div>

			<div className="icons">{ allSocialLogos }</div>

			<p>
				<a href="https://github.com/Automattic/social-logos">GitHub</a>
			</p>
		</div>
	);
}

export default SocialLogosExample;
