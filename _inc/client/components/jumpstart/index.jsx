/**
 * External dependencies
 */
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Card from 'components/card';
import Button from 'components/button';
import { translate as __ } from 'i18n-calypso';
import Gridicon from 'components/gridicon';

/**
 * Internal dependencies
 */
import {
	jumpStartActivate,
	jumpStartSkip,
	isJumpstarting as _isJumpstarting
} from 'state/jumpstart';
import { getModulesByFeature as _getModulesByFeature } from 'state/modules';
import onKeyDownCallback from 'utils/onkeydown-callback';

const JumpStart = React.createClass( {

	displayName: 'JumpStart',

	render: function() {
		const jumpstartModules = this.props.jumpstartFeatures.map( ( module ) => (
			<div
				className="jp-jumpstart__feature-list-column"
				key={ `module-card_${ module.name }` /* https://fb.me/react-warning-keys */ } >
				<div className="jp-jumpstart__feature-content">
					<h4
						className="jp-jumpstart__feature-content-title"
						title={ module.name }>
						{ module.name }
					</h4>
					<p dangerouslySetInnerHTML={ renderJumpstartDescription( module ) } />
				</div>
			</div>
		) );

		return (
			<div className="jp-jumpstart-full__container">
				<svg className="jp-jumpstart-full__svg-stars" height="54" width="56" version="1.1" viewBox="0 0 56 54"><g fill="none" opacity="0.95" stroke="none" strokeWidth="1"><g fill="#C8D7E1" transform="translate(-268.000000, -101.000000)"><g transform="translate(160.000000, 32.000000)"><g transform="translate(104.000000, 69.000000)"><polyline points="53.6 10.3 59.3 8 53.6 5.7 51.3 0 49 5.7 43.3 8 49 10.3 51.3 16 53.6 10.3"/><polyline points="10.5 51.2 14.8 49.5 10.5 47.8 8.8 43.5 7 47.8 2.8 49.5 7 51.2 8.8 55.5 10.5 51.2" transform="translate(8.757724, 49.487494) rotate(315.000000) translate(-8.757724, -49.487494) "/></g></g></g></g></svg>
				<svg className="jp-jumpstart-full__svg-jupiter" height="100" width="50" version="1.1" viewBox="0 0 50 100"><defs><path id="path-1" d="M0.95 40.37C-4.37 67.46 13.27 93.73 40.37 99.05 67.46 104.37 93.73 86.73 99.05 59.63 104.37 32.54 86.73 6.27 59.63 0.95 32.54-4.37 6.27 13.27 0.95 40.37"/></defs><g id="Welcome" fill="none" opacity="0.5" stroke="none" strokeWidth="1"><g id="v1.2" transform="translate(-1215.000000, -93.000000)"><g id="lrg-planet-+-jupiter-Mask" transform="translate(160.000000, 32.000000)"><g id="jupiter" transform="translate(1055.000000, 61.000000)"><path id="jupFill-1" d="M0.94 40.19C-4.36 67.16 13.22 93.32 40.19 98.62 67.16 103.92 93.32 86.35 98.62 59.37 103.92 32.4 86.35 6.24 59.37 0.94 32.4-4.36 6.24 13.22 0.94 40.19" fill="#C8D7E1"/><g id="jupGroup-17"><mask id="mask-jup" fill="white"><path d="M0.95 40.37C-4.37 67.46 13.27 93.73 40.37 99.05 67.46 104.37 93.73 86.73 99.05 59.63 104.37 32.54 86.73 6.27 59.63 0.95 32.54-4.37 6.27 13.27 0.95 40.37"/></mask><g id="jupClip-3"/><path id="jupFill-2" d="M49.59 38.06C51.29 29.39 59.7 23.73 68.38 25.44 77.05 27.14 82.7 35.55 81 44.23 79.3 52.9 70.88 58.55 62.21 56.85 53.53 55.15 47.88 46.73 49.59 38.06" fill="#E9EFF3"/><path id="jupFill-4" d="M53.93 52.41C48.66 47.1 42.15 43.21 34.98 41.08L37.21 29.74C44.64 30.48 52.15 29.34 59.03 26.41L53.93 52.41" fill="#E9EFF3"/><path id="jupFill-5" d="M30.93 34.4C31.55 31.25 34.6 29.2 37.75 29.82 40.89 30.43 42.94 33.49 42.32 36.63 41.71 39.78 38.65 41.83 35.51 41.21 32.36 40.59 30.31 37.54 30.93 34.4" fill="#E9EFF3"/><polyline id="jupFill-9" fill="#E9EFF3" points="35.54 41.22 -14.22 31.44 -11.99 20.08 37.77 29.85 35.54 41.22"/><path id="jupFill-10" d="M30.34 67.29C31.4 61.93 36.59 58.44 41.95 59.49 47.31 60.54 50.8 65.74 49.75 71.1 48.69 76.46 43.5 79.95 38.14 78.89 32.78 77.84 29.29 72.65 30.34 67.29" fill="#E9EFF3"/><path id="jupFill-11" d="M33.02 76.15C29.77 72.87 25.75 70.47 21.32 69.15L22.7 62.15C27.29 62.61 31.93 61.9 36.18 60.09L33.02 76.15" fill="#E9EFF3"/><path id="jupFill-12" d="M18.82 65.02C19.2 63.08 21.09 61.82 23.03 62.2 24.97 62.58 26.24 64.46 25.86 66.41 25.48 68.35 23.59 69.62 21.65 69.23 19.7 68.85 18.44 66.97 18.82 65.02" fill="#E9EFF3"/><path id="jupFill-13" d="M43.91 78.29C48.16 76.49 52.8 75.78 57.39 76.24L58.77 69.23C54.34 67.92 50.32 65.51 47.07 62.23L43.91 78.29" fill="#E9EFF3"/><polyline id="jupFill-16" fill="#E9EFF3" points="21.67 69.24 -67.61 51.7 -66.23 44.68 23.05 62.22 21.67 69.24"/></g><path id="jupFill-18" d="M35.02 68.89C35.07 65.99 37.47 63.68 40.37 63.74 43.28 63.79 45.58 66.19 45.53 69.09 45.47 72 43.07 74.3 40.17 74.25 37.27 74.19 34.96 71.79 35.02 68.89" fill="#E9EFF3"/></g></g></g></g></svg>

				<Gridicon
					icon="cross-small"
					className="jp-jumpstart-full__dismiss"
					tabIndex="0"
					onKeyDown={ onKeyDownCallback( this.props.jumpStartSkip ) }
					onClick={ this.props.jumpStartSkip }
				/>

				<div className="jp-jumpstart">
					<svg height="153px" width="199px" version="1.1" viewBox="0 0 199 153"><path id="Shape" d="M62.1,114.8 C37.5,132.9 17,147.9 10.6,152.6 L10.9,152.6 L29.2,141.1 L14.7,152.6 L15.8,152.6 L29.9,142.2 L18.7,152.6 L19.9,152.6 C29.1,145.3 45.5,132.3 64.3,117.5 L62.1,114.8 L62.1,114.8 Z" fill="#E9EFF4"/><path id="Shape" d="M77.7,102 L80.1,104.2 C111.9,79 149,49.9 170.4,33.4 C148.6,49.7 110.5,77.9 77.7,102 L77.7,102 Z" fill="#E9EFF4"/><path id="Shape" d="M176.2,29.4 C176.1,29.2 175.9,29.1 175.8,29.1 L175.7,29.1 L175.5,29.1 C175.2,29 175,29 174.8,29 C174.3,29 173.9,29 173.5,29.1 C172.7,29.2 171.9,29.4 171.1,29.7 C169.5,30.2 168.1,30.9 166.6,31.6 C166.3,31.7 166,32 166,32.4 C165.9,33 166.3,33.5 166.9,33.6 L167,33.6 C167.2,33.6 167.5,33.6 167.7,33.7 C168,33.8 168.2,33.8 168.4,33.9 C168.9,34.1 169.2,34.3 169.4,34.5 L169.4,34.5 C169.6,34.6 169.7,35 169.8,35.5 L169.8,36.2 C169.8,36.4 169.7,36.7 169.7,36.9 L169.7,37 C169.6,37.3 169.7,37.7 170,37.9 C170.5,38.3 171.1,38.2 171.5,37.8 C171.6,37.7 171.7,37.5 171.9,37.4 L171.9,37.4 C171.9,37.4 171.9,37.4 171.9,37.3 C172.8,36.3 173.7,35.2 174.5,34 C175,33.3 175.4,32.6 175.8,31.9 C176,31.5 176.2,31.1 176.3,30.7 C176.5,29.9 176.2,29.4 176.2,29.4 Z" fill="#004F82"/><path id="Shape" d="M100,133.8 C100,116.8 90.6,103.2 77.5,100.9 C75.6,107.2 65.4,107.4 63.2,101.2 L63.1,100.9 C48.5,103.9 38.3,117.6 36.8,133.4 C34.6,156.1 36.3,152.5 36.3,152.5 L100.2,152.5" fill="#0084C0"/><path id="Shape" d="M55.1,124.1 C55.2,125.3 55,126.4 55,127.6 L54.7,131.1 L54.1,138 L53.4,144.9 C53.2,147.2 52.9,149.5 52.4,151.8 C52.4,151.9 52.3,151.9 52.2,151.9 C52.1,151.9 52.1,151.8 52.1,151.7 C52,149.4 52.2,147.1 52.4,144.8 L53,137.9 L53.6,131 L53.9,127.5 C54,126.4 54.1,125.2 54.4,124.1 C54.5,123.9 54.6,123.8 54.8,123.9 C54.9,123.9 55,124 55.1,124.1 L55.1,124.1 Z" fill="#004F81"/><path id="Path" d="M77.1,95.7 C77.3,96.3 77.3,97 77.3,97.6 C77.3,98.2 77.3,98.9 77.4,99.4 C77.5,99.9 77.8,100.3 78.2,100.6 C78.4,100.7 78.6,100.8 78.9,100.9 C79.2,101 79.6,101.1 79.9,101.2 C82.4,102.1 84.5,103.5 86.6,105 C88.6,106.5 90.5,108.2 92.3,110.1 C94,112 95.5,114.1 96.5,116.5 C96.5,116.6 96.5,116.7 96.4,116.7 C96.3,116.7 96.2,116.7 96.2,116.6 C94.8,114.5 93.3,112.6 91.6,110.7 C89.9,108.9 88,107.2 86,105.8 C85,105.1 84,104.4 82.9,103.8 C81.8,103.2 80.7,102.6 79.6,102.2 C79.3,102.1 79,102 78.8,101.9 C78.4,101.8 78.1,101.7 77.8,101.5 C77.2,101.1 76.7,100.4 76.5,99.7 C76.4,99.3 76.4,98.9 76.4,98.6 L76.4,97.7 C76.4,97.1 76.3,96.4 76.6,95.8 C76.7,95.6 76.9,95.5 77.1,95.7 C77,95.5 77,95.6 77.1,95.7 L77.1,95.7 Z" fill="#004F81"/><path id="Shape" d="M79.8,68.9 C81,71.2 81.7,73.8 82.3,76.3 C82.9,78.8 83.3,81.4 83.4,84.1 C83.4,86.7 83,89.5 81.6,91.8 C80.9,93 79.9,94 78.8,94.8 C77.6,95.6 76.3,96 75,96.3 C72.3,96.8 69.5,96.4 67.1,95.2 C64.7,94.1 62.5,92.4 60.7,90.5 C57,86.7 54.5,82 52.9,77.1 C52.9,77 52.9,76.9 53,76.9 C53.1,76.9 53.2,76.9 53.2,77 C55.4,81.7 57.9,86.2 61.5,89.9 C63.3,91.7 65.3,93.3 67.6,94.3 C69.9,95.3 72.4,95.7 74.8,95.2 C76,94.9 77.2,94.5 78.2,93.8 C79.2,93.1 80.1,92.2 80.7,91.2 C82,89.1 82.4,86.5 82.4,84 C82.4,81.5 82,78.9 81.4,76.4 C80.8,73.9 79.9,71.5 79.2,69 C79.1,68.8 79.2,68.6 79.4,68.6 C79.6,68.7 79.7,68.7 79.8,68.9 L79.8,68.9 Z" fill="#004F81"/><path id="Shape" d="M64.6,61.4 C72.6,58.2 79.6,60 79.1,63.8 C78.7,67.1 62.6,68.2 60.7,72.8 C59.5,75.8 61.3,80.3 62.8,83.2 C63.7,84.9 63.3,86.9 62,88.2 L60.6,89.9 C51.7,81.1 43.7,69.7 64.6,61.4 L64.6,61.4 Z" fill="#004F81"/><path id="Path" d="M74.4,78.8 C74.9,79.6 75.3,80.5 75.7,81.3 C76,82.2 76.4,83.1 76.6,84 C76.6,84.2 76.5,84.4 76.3,84.4 C76.1,84.4 76,84.4 75.9,84.2 C75.4,83.4 75.1,82.5 74.7,81.6 C74.4,80.7 74.1,79.8 73.9,78.9 C73.9,78.8 74,78.6 74.1,78.6 C74.2,78.7 74.3,78.7 74.4,78.8 L74.4,78.8 Z" fill="#004F81"/><path id="Shape" d="M79.2,79.6 C79.7,79.4 80,78.8 79.8,78.3 L79.2,76.8 C79,76.3 78.4,76 77.9,76.2 C77.4,76.4 77.1,77 77.3,77.5 L77.9,79 C78.1,79.5 78.7,79.8 79.2,79.6 Z" fill="#004F84"/><path id="Path" d="M69.4,83.4 C69.9,83.2 70.2,82.6 70,82.1 L69.4,80.6 C69.2,80.1 68.6,79.8 68.1,80 C67.6,80.2 67.3,80.8 67.5,81.3 L68.1,82.8 C68.3,83.4 68.9,83.6 69.4,83.4 Z" fill="#004F84"/><path id="Shape" d="M77.2,87.7 C77.1,88.1 76.8,88.4 76.4,88.7 C76,89 75.4,89.2 75,89.2 C74.7,89.2 74.4,89.1 74.1,88.9 C73.9,88.7 73.6,88.8 73.4,89 C73.2,89.2 73.3,89.5 73.5,89.7 C73.9,90 74.5,90.1 75,90.1 C75.7,90.1 76.4,89.9 77,89.5 C77.6,89.1 78,88.6 78.2,87.9 C78.3,87.6 78.1,87.4 77.9,87.3 C77.7,87.2 77.3,87.4 77.2,87.7 L77.2,87.7 Z" fill="#004F81"/><path id="Shape" d="M67,77 C66.8,77 66.5,77.2 66.2,77.3 C65.9,77.4 65.6,77.6 65.3,77.8 C65,78 64.8,78.2 64.5,78.4 C64.3,78.6 64,78.8 63.9,79.1 C63.8,79.3 63.6,79.3 63.4,79.2 C63.3,79.1 63.2,79 63.3,78.8 C63.5,77.9 64.2,77.4 64.8,76.9 C65.1,76.7 65.5,76.5 65.9,76.4 C66.3,76.3 66.7,76.2 67.2,76.3 C67.4,76.3 67.5,76.5 67.4,76.7 C67.3,76.8 67.2,76.9 67,77 Z" fill="#004F81"/><path id="Path" d="M74.9,73.2 C75.2,72.8 75.6,72.6 75.9,72.4 C76.3,72.2 76.7,72.1 77,72.1 C77.8,72 78.6,72 79.4,72.5 C79.6,72.6 79.6,72.8 79.5,73 C79.4,73.1 79.3,73.2 79.1,73.1 C78.8,73 78.5,73 78.2,73 C77.9,73 77.5,73 77.2,73.1 C76.9,73.2 76.5,73.2 76.2,73.3 C75.9,73.4 75.6,73.5 75.4,73.6 L75.3,73.7 C75.1,73.8 74.9,73.7 74.9,73.6 L74.9,73.2 L74.9,73.2 Z" fill="#004F81"/><path id="Shape" d="M79.9,63.7 C71.9,49.7 45.2,60.8 51.9,78" fill="#00A9DE"/><path id="Shape" d="M63.2,96 C63.4,96.8 63.5,97.6 63.6,98.5 C63.6,99.3 63.7,100.1 63.7,101 L63.7,100.8 C63.9,101.2 64.1,101.7 64.3,102.2 C64.5,102.6 64.8,103.1 65.1,103.4 C65.4,103.8 65.8,104.1 66.2,104.4 C66.6,104.7 67,105 67.5,105.2 C67.6,105.3 67.6,105.4 67.6,105.5 C67.6,105.6 67.5,105.6 67.4,105.6 C66.8,105.5 66.3,105.4 65.8,105.1 C65.3,104.8 64.8,104.5 64.4,104 C64,103.6 63.7,103.1 63.4,102.6 C63.1,102.1 62.9,101.6 62.7,101 L62.7,100.8 C62.7,100 62.7,99.2 62.8,98.3 C62.9,97.5 63,96.7 63.2,95.8 C63,96 63.1,95.9 63.2,96 L63.2,96 Z" fill="#004F81"/><path id="Shape" d="M66.8,17.5 C66.5,17.1 66.2,17 65.9,16.9 L65.1,16.6 L59.1,14.5 L57.6,14 C57.1,13.9 56.6,13.7 56.2,13.5 C55.4,13.1 54.7,12.3 54.4,11.5 L52.3,5.5 L51.2,2.5 C51.1,2.2 51,1.9 50.8,1.6 C50.7,1.4 50.6,1.2 50.3,1.1 C50,0.9 49.6,1 49.4,1.2 C49,1.5 48.9,1.8 48.8,2.1 L48.5,2.9 L46.4,8.9 L45.9,10.4 C45.8,10.9 45.6,11.4 45.4,11.8 C44.9,12.6 44.1,13.4 43.3,13.7 L37.3,15.9 L34.3,17 C34.1,17.1 33.8,17.2 33.5,17.4 C33.4,17.5 33.2,17.7 33.1,17.9 C33,18.2 33.1,18.5 33.2,18.7 C33.5,19.1 33.8,19.2 34.1,19.3 L34.9,19.6 L41,21.6 C42,21.9 43.1,22.2 44,22.6 C44.9,23.1 45.7,23.8 46.1,24.8 L47.8,30.8 L48.8,33.8 C48.9,34 49,34.3 49.2,34.6 C49.3,34.7 49.4,34.9 49.6,35 C49.8,35.1 50.1,35 50.3,34.9 C50.6,34.7 50.7,34.4 50.8,34.1 L51.1,33.3 L53.3,27.3 L53.8,25.8 C54,25.3 54.2,24.8 54.4,24.4 C54.9,23.5 55.7,22.8 56.5,22.5 L62.5,20.4 L65.5,19.3 C65.8,19.2 66.1,19.1 66.4,18.9 C66.6,18.8 66.8,18.7 66.9,18.4 C67.1,18.1 67,17.7 66.8,17.5 Z" fill="#D5E5EB"/><path id="Shape" d="M162.4,79.1 C162.3,78.8 162.1,78.8 162,78.7 C161.7,78.6 161.6,78.6 161.4,78.5 L159.3,77.7 C158.9,77.6 158.7,77.5 158.5,77.3 C158.3,77.1 158.1,76.8 158,76.6 L157.3,74.5 L157.1,74 C157,73.8 157,73.6 156.7,73.3 C156.6,73.2 156.5,73.2 156.3,73.1 C156.2,73.1 155.9,73.1 155.8,73.2 C155.5,73.3 155.5,73.5 155.4,73.6 C155.3,73.9 155.3,74 155.2,74.2 L154.5,76.3 C154.4,76.7 154.3,76.9 154.1,77.1 C153.9,77.3 153.6,77.5 153.4,77.6 L151.3,78.4 L150.8,78.6 C150.7,78.6 150.5,78.7 150.2,78.9 C150.1,79 150,79.1 150,79.2 C149.9,79.3 149.9,79.5 150,79.6 C150.1,79.8 150.3,79.8 150.4,79.9 C150.7,80 150.8,80 151,80.1 L153.1,80.7 C153.4,80.8 153.7,80.9 154,81.1 C154.3,81.3 154.5,81.6 154.7,81.9 L155.3,84.2 L155.5,84.7 C155.6,84.8 155.6,85.1 155.8,85.3 C155.9,85.4 156,85.5 156.1,85.5 C156.2,85.6 156.4,85.6 156.5,85.5 C156.7,85.3 156.7,85.2 156.8,85.1 C156.9,84.8 156.9,84.7 157,84.5 L157.8,82.4 C157.9,82 158,81.8 158.2,81.6 C158.4,81.4 158.7,81.2 158.9,81.1 L161,80.4 L161.5,80.2 C161.7,80.2 161.9,80.2 162.2,79.9 C162.3,79.9 162.3,79.8 162.4,79.6 C162.5,79.5 162.5,79.2 162.4,79.1 Z" fill="#D5E5EB"/><path id="Shape" d="M132.9,90.8 C132.8,90.5 132.5,90.4 132.2,90.5 L130,91.6 L127.8,90.5 C127.6,90.4 127.5,90.4 127.3,90.5 C127.1,90.6 127,90.9 127.1,91.2 L128.2,93.5 C127.8,94.3 127.5,95.1 127.2,95.9 L127.2,96 C127.1,96.1 127.1,96.2 127.2,96.3 C127.3,96.4 127.5,96.5 127.7,96.4 C128.5,96 129.2,95.5 130,95 L130,95 C130.9,95.5 131.6,96 132.4,96.5 L132.7,96.5 C132.9,96.4 133,96.2 132.9,96 C132.5,95.2 132.2,94.4 131.9,93.6 C132.3,92.8 132.6,92 133,91.3 C133,91.1 133,91 132.9,90.8 Z" fill="#D5E5EB"/><path id="Shape" d="M136.1,35.6 C136,35.3 135.7,35.2 135.4,35.3 L133.2,36.4 L131,35.3 C130.8,35.2 130.7,35.2 130.5,35.3 C130.3,35.4 130.2,35.7 130.3,36 L131.4,38.3 C131,39.1 130.7,39.9 130.4,40.7 L130.4,40.8 C130.3,40.9 130.3,41 130.4,41.1 C130.5,41.2 130.7,41.3 130.9,41.2 C131.7,40.8 132.4,40.3 133.2,39.8 C134.1,40.3 134.8,40.7 135.6,41.3 L135.9,41.3 C136.1,41.2 136.2,41 136.1,40.8 C135.7,40 135.4,39.2 135.1,38.4 C135.5,37.6 135.8,36.8 136.2,36.1 C136.2,35.9 136.2,35.8 136.1,35.6 Z" fill="#D5E5EB"/><path id="Shape" d="M78.2,27.2 L78.8,25.9 C78.9,25.8 79,25.6 78.9,25.3 C78.9,25.1 78.7,24.9 78.5,24.8 C78.3,24.7 78.1,24.7 78,24.7 C77.6,24.8 77.4,24.9 77.2,25 L74.7,26.2 C74.3,26.4 73.9,26.7 73.6,26.7 C73.3,26.8 72.9,26.7 72.6,26.6 L70.1,25.4 L68.8,24.8 C68.6,24.7 68.5,24.6 68.1,24.7 C67.9,24.7 67.7,24.9 67.6,25.1 C67.5,25.3 67.5,25.5 67.5,25.6 C67.6,26 67.7,26.2 67.8,26.4 L69,28.9 C69.2,29.3 69.5,29.7 69.5,30 C69.6,30.4 69.5,30.8 69.4,31.1 L68.2,33.6 L67.6,34.9 C67.5,35.1 67.4,35.2 67.5,35.5 C67.5,35.6 67.6,35.8 67.8,35.9 L68.2,35.9 C68.6,35.8 68.8,35.7 69,35.6 L71.5,34.3 C71.9,34.1 72.3,33.8 72.7,33.7 C73.1,33.6 73.6,33.6 74,33.7 L74,33.7 L76.6,35.3 L77.9,35.9 C78,36 78.1,36 78.4,36 C78.6,36 78.7,35.9 78.8,35.7 L78.8,35.3 C78.7,34.9 78.6,34.7 78.5,34.5 L77.4,32 C77.2,31.5 76.9,31.1 76.9,30.8 C76.8,30.4 76.9,30 77,29.7 L78.2,27.2 Z" fill="#D5E5EB"/><path id="Shape" d="M114.4,48.1 C114.3,47.8 114.1,47.8 114,47.7 C113.7,47.6 113.6,47.6 113.4,47.5 L111.3,46.7 C110.9,46.6 110.7,46.5 110.5,46.3 C110.3,46.1 110.1,45.8 110,45.6 L109.3,43.5 L109.1,43 C109,42.8 109,42.6 108.7,42.3 C108.6,42.2 108.5,42.2 108.3,42.1 C108.2,42.1 107.9,42.1 107.8,42.2 C107.5,42.3 107.5,42.5 107.4,42.6 C107.3,42.9 107.3,43 107.2,43.2 L106.5,45.3 C106.4,45.7 106.3,45.9 106.1,46.1 C105.9,46.3 105.6,46.5 105.4,46.6 L103.3,47.4 L102.8,47.6 C102.7,47.6 102.5,47.7 102.2,47.9 C102.1,48 102,48.1 102,48.2 C101.9,48.3 101.9,48.5 102,48.6 C102.1,48.8 102.3,48.8 102.4,48.9 C102.7,49 102.8,49 103,49.1 L105.1,49.7 C105.4,49.8 105.7,49.9 106,50.1 C106.3,50.3 106.5,50.6 106.7,50.9 L107.3,53.2 L107.5,53.7 C107.6,53.8 107.6,54.1 107.8,54.3 C107.9,54.4 108,54.5 108.1,54.5 C108.2,54.6 108.4,54.6 108.5,54.5 C108.7,54.3 108.7,54.2 108.8,54.1 C108.9,53.8 108.9,53.7 109,53.5 L109.8,51.4 C109.9,51 110,50.8 110.2,50.6 C110.4,50.4 110.7,50.2 110.9,50.1 L113,49.4 L113.5,49.2 C113.7,49.2 113.9,49.2 114.2,48.9 C114.3,48.9 114.3,48.8 114.4,48.6 C114.5,48.5 114.5,48.2 114.4,48.1 Z" fill="#D5E5EB"/><path id="Shape" d="M34.4,73.1 C34.3,72.8 34.1,72.8 34,72.7 C33.7,72.6 33.6,72.6 33.4,72.5 L31.3,71.7 C30.9,71.6 30.7,71.5 30.5,71.3 C30.3,71.1 30.1,70.8 30,70.6 L29.3,68.5 L29.1,68 C29,67.8 29,67.6 28.7,67.3 C28.6,67.2 28.5,67.2 28.3,67.1 C28.2,67.1 27.9,67.1 27.8,67.2 C27.5,67.3 27.5,67.5 27.4,67.6 C27.3,67.9 27.3,68 27.2,68.2 L26.5,70.3 C26.4,70.7 26.3,70.9 26.1,71.1 C25.9,71.3 25.6,71.5 25.4,71.6 L23.3,72.4 L22.8,72.6 C22.7,72.6 22.5,72.7 22.2,72.9 C22.1,73 22,73.1 22,73.2 C21.9,73.3 21.9,73.5 22,73.6 C22.1,73.8 22.3,73.8 22.4,73.9 C22.7,74 22.8,74 23,74.1 L25.1,74.7 C25.4,74.8 25.7,74.9 26,75.1 C26.3,75.3 26.5,75.6 26.7,75.9 L27.3,78.2 L27.5,78.7 C27.6,78.8 27.6,79.1 27.8,79.3 C27.9,79.4 28,79.5 28.1,79.5 C28.2,79.6 28.4,79.6 28.5,79.5 C28.7,79.3 28.7,79.2 28.8,79.1 C28.9,78.8 28.9,78.7 29,78.5 L29.8,76.4 C29.9,76 30,75.8 30.2,75.6 C30.4,75.4 30.7,75.2 30.9,75.1 L33,74.4 L33.5,74.2 C33.7,74.2 33.9,74.2 34.2,73.9 C34.3,73.9 34.3,73.8 34.4,73.6 C34.5,73.5 34.5,73.2 34.4,73.1 Z" fill="#D5E5EB"/><path id="Shape" d="M86.7,61.1 L86.7,61.1 C86.6,61 86.6,60.9 86.5,60.9 C86,60.7 85.5,60.4 85,60.2 C84.5,60 84,59.8 83.4,59.8 L82.6,59.7 C82.4,59.7 82.1,59.8 81.8,59.8 C81.6,59.8 81.3,59.9 81,59.9 L80.2,60.1 C78,60.7 76.1,61.7 74.3,62.9 C72.5,64.1 70.8,65.4 69.2,66.8 C67.6,68.2 66.1,69.7 64.7,71.3 L64.6,71.4 L59.7,73.9 C56.7,75.4 53.8,76.9 50.9,78.5 C50.8,78.6 50.7,78.7 50.8,78.9 C50.8,79.1 51,79.2 51.2,79.1 C54.2,77.7 57.1,76.3 60.1,74.8 L69,70.4 L77.8,66 C80.6,64.5 83.5,63.1 86.2,61.5 L86.3,61.5 C86.4,61.5 86.7,61.4 86.7,61.3 C86.7,61.3 86.7,61.2 86.7,61.1 L86.7,61.1 Z" fill="#74DCFC"/><path id="Shape" d="M154.3,112.4 L111.8,112.4 C109.2,112.4 107,114.3 106.7,116.9 L102.3,148.4 L80.3,148.4 C78.5,148.4 77.1,149.8 77.1,151.6 L77.1,152.2 L101.8,152.2 L122.3,152.2 L154.7,152.2 L159.4,118.3 C159.8,115.2 157.4,112.4 154.3,112.4 Z" fill="#74DCFC"/><path id="Shape" d="M198.3,152.8 C181.8,153.2 165.3,153.3 148.8,153.5 L99.3,153.6 C66.3,153.5 33.3,153.6 0.3,153 C0.1,153 1.42108547e-14,152.8 1.42108547e-14,152.7 C1.42108547e-14,152.5 0.1,152.4 0.3,152.4 C33.3,151.8 66.3,151.9 99.3,151.8 L148.8,151.9 C165.3,152 181.8,152.1 198.3,152.6 C198.4,152.6 198.5,152.7 198.5,152.8 C198.4,152.7 198.3,152.8 198.3,152.8 L198.3,152.8 Z" fill="#86A6BD"/></svg>

					<h1 className="jp-jumpstart__title">
						{ __( 'Your Jetpack site is powering up.' ) }
					</h1>

					<Card>
						<p className="jp-jumpstart__description">
							{ __( "Quickly enhance your site by activating Jetpack's recommended features." ) }
						</p>
					</Card>

					<Card>
						<Button
							primary={ true }
							onClick={ this.props.jumpStartActivate }
							disabled={ this.props.isJumpstarting }
						>
							{ __( 'Activate Recommended Features' ) }
						</Button>
					</Card>

					<Card>
						<p className="jp-jumpstart__description">
							{ __( "Jetpack's recommended features include:" ) }
						</p>

						<div className="jp-jumpstart__feature-list">
							{ jumpstartModules }
						</div>

						<Button
							primary={ true }
							onClick={ this.props.jumpStartActivate }
							disabled={ this.props.isJumpstarting }
						>
							{ __( 'Activate Recommended Features' ) }
						</Button>

						<p className="jp-jumpstart__note">
							{ __( 'Features can be activated or deactivated at any time.' ) }
						</p>
					</Card>
				</div>
			</div>
		);
	}
} );

export default connect(
	state => {
		return {
			isJumpstarting: _isJumpstarting( state ),
			jumpstartFeatures: _getModulesByFeature( state, 'Jumpstart' )
		};
	},
	dispatch => bindActionCreators( { jumpStartActivate, jumpStartSkip }, dispatch )
)( JumpStart );

function renderJumpstartDescription( module ) {
	// Rationale behind returning an object and not just the string
	// https://facebook.github.io/react/tips/dangerously-set-inner-html.html
	return { __html: module.jumpstart_desc };
}
