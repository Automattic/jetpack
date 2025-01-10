/* eslint-disable no-alert -- ok for demo */
import React, { useCallback, useState } from 'react';
import { SocialLogo } from './social-logo';
import { SocialLogoData } from './social-logo-data';
import '../css/example.css';

/**
 * An example React component that displays a single social logo.
 *
 * @param {object}  props               - The properties.
 * @param {string}  props.name          - Logo name.
 * @param {number}  props.iconSize      - Icon size.
 * @param {boolean} props.showIconNames - Whether to show icon names.
 * @return {React.Component} The `SocialLogoItemExample` component.
 */
function SocialLogoItemExample( { name, iconSize, showIconNames } ) {
	const handleClick = useCallback( () => {
		const code = `<SocialLogo icon="${ name }" size="${ iconSize }" />`;
		window.prompt( 'Copy component code:', code );
	}, [ iconSize, name ] );

	return (
		<div key={ name }>
			<SocialLogo icon={ name } size={ iconSize } onClick={ handleClick } />
			{ showIconNames && <p>{ name }</p> }
		</div>
	);
}

/**
 * An example React component that displays all the social logos.
 *
 * @return {React.Component} The `SocialLogosExample` component.
 */
function SocialLogosExample() {
	const [ useSmallIcons, setUseSmallIcons ] = useState( false );
	const [ showIconNames, setShowIconNames ] = useState( true );

	const iconSize = useSmallIcons ? 24 : 48;

	const handleSmallIconsToggle = useCallback(
		e => {
			setUseSmallIcons( e.target.checked );
		},
		[ setUseSmallIcons ]
	);

	const handleIconNamesToggle = useCallback(
		e => {
			setShowIconNames( e.target.checked );
		},
		[ setShowIconNames ]
	);

	const allSocialLogos = SocialLogoData.map( logo => (
		<SocialLogoItemExample
			key={ logo.name }
			name={ logo.name }
			iconSize={ iconSize }
			showIconNames={ showIconNames }
		/>
	) );

	return (
		<div className="social-logos-example">
			<h1>Social Logos</h1>

			<div className="display-control-group">
				<div className="display-control">
					<h4>Small icons</h4>
					{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control -- https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/issues/578 */ }
					<label className="switch" htmlFor="useSmallIcons">
						<input
							id="useSmallIcons"
							type="checkbox"
							onChange={ handleSmallIconsToggle }
							checked={ useSmallIcons }
						/>
						<span className="handle"></span>
					</label>
				</div>
				<div className="display-control">
					<h4>Icon names</h4>
					{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control -- https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/issues/578 */ }
					<label className="switch" htmlFor="showIconNames">
						<input
							id="showIconNames"
							type="checkbox"
							onChange={ handleIconNamesToggle }
							checked={ showIconNames }
						/>
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
