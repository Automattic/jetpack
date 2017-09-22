/**
 * External dependencies
 */
import React from 'react';
import { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';

/**
 * Internal dependencies
 */
import JetpackDialogue from 'components/jetpack-dialogue';
import { imagePath } from 'constants';

class WelcomePremium extends Component {
	renderInnerContent() {
		return (
			<div>
				<p>
					{ __( 'Thanks for choosing a Jetpack Premium plan. Jetpack is now backing up your site, scanning for' +
						' security threats, and enabling monetization features.'
					) }
				</p>
				<svg className="jp-welcome__svg" id="customizeTheme" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 240 149">
					<path fill="#F3F6F8" d="M144,33V22.8h-31.4c0.2,0.4,0.4,0.8,0.6,1.1c3.5,7.5,0.4,16.4-7.1,19.9l-0.2,0.1l-0.3,0.1 c-0.6,0.3-1.3,0.5-1.9,0.7l-0.3,0.1c-0.1,0-0.2,0.1-0.3,0.1c-0.2,0-0.4,0.1-0.5,0.1c-0.3-0.5-0.4-1.9-0.5-2.7 c-0.1-1.3-0.1-2-0.7-2.2c-0.8-0.3-1.9,0.5-2.7,2.1c-0.5,1-0.7,2-0.7,3.1c-8.2-0.8-14.2-8.2-13.4-16.4c0.2-1.7,0.6-3.4,1.4-4.9 c0.2-0.4,0.4-0.8,0.6-1.1H54.1v53.1c4.7,0.1,14-1.6,14.1,2.7V62.8h60.7v18.8c4.8,0,9.7,1.1,14.5,0.3c0.2,0,0.4,0.1,0.5,0.3 c0.5,2.8,2.3,28.4,2.5,30.9c0.2,2.3,0.6,4.6,0.1,6.9c-0.1,0.2-0.2,0.3-0.4,0.3c-1.7,0.1-3.5,0.3-5.2,0.3c-1.6,0-7.8-0.2-8.3-0.3 c-0.5-0.2-3.2,0.4-4.6,0.5c-1.3,0.1-6.5,0.4-7.7,0.5c-1.6,0-3.3,0-3.3-1.6c0-0.9-0.8-7.1-0.7-8H68.7c0,0.2-9.9,0-14.6-0.1v14h141.9 V33H144z M186.3,111.6h-28.7V64.9c0-1.6,1.3-3,3-3l0,0h25.7L186.3,111.6z"/>
					<path fill="#D9A2DC" d="M113.2,23.9c-0.2-0.4-0.4-0.8-0.6-1.1c-0.2-0.3-0.4-0.6-0.5-0.9c-4.7-6.8-14-8.6-20.8-3.9 c-1.5,1-2.9,2.4-3.9,3.9c-0.2,0.3-0.4,0.6-0.6,0.9c-0.2,0.4-0.4,0.8-0.6,1.1c-3.5,7.5-0.4,16.4,7.1,20c1.6,0.7,3.2,1.2,4.9,1.4 c0-1.1,0.2-2.1,0.7-3.1c0.7-1.6,1.8-2.4,2.7-2.1c0.5,0.2,0.6,0.9,0.7,2.2c0.1,0.8,0.2,2.2,0.5,2.7c0.2,0,0.4-0.1,0.5-0.1 c0.1,0,0.2-0.1,0.3-0.1l0.3-0.1c0.6-0.2,1.3-0.4,1.9-0.7l0.3-0.1l0.2-0.1C113.6,40.3,116.7,31.4,113.2,23.9L113.2,23.9z"/>
					<polygon fill="#C879CC" points="144,10.9 144,22.9 144,33.1 196,33.1 204,33.1 204,10.9 "/>
					<path fill="#F3F6F8" d="M58.3,97.7l8-0.1l0.6,6.3l-6.5-0.6C60.3,103.4,57.8,102.9,58.3,97.7z"/>
					<path fill="#E1EFF9" d="M56.6,23.9H54c-0.6,0-1-0.5-1-1v-2.6c0-0.6,0.5-1,1-1c0.6,0,1,0.5,1,1l0,0v1.5h1.5c0.6,0,1,0.5,1,1 C57.6,23.4,57.2,23.9,56.6,23.9z"/>
					<path fill="#E1EFF9" d="M54,16.1c-0.6,0-1-0.5-1-1V9.8c0-0.6,0.5-1,1-1c0.6,0,1,0.5,1,1V15C55.1,15.6,54.6,16.1,54,16.1 C54,16.1,54,16.1,54,16.1z M55.4,5.9c-0.6,0-1-0.5-1-1c0-0.2,0.1-0.4,0.2-0.6c1.1-1.7,2.7-2.9,4.5-3.6c0.5-0.2,1.1,0.1,1.3,0.6 c0.2,0.5-0.1,1.1-0.6,1.3l0,0c-1.4,0.6-2.7,1.6-3.5,2.8C56.1,5.7,55.8,5.9,55.4,5.9z M194.6,5.8c-0.3,0-0.7-0.2-0.9-0.5 c-0.9-1.3-2.1-2.3-3.5-2.8c-0.5-0.2-0.8-0.8-0.6-1.3c0.2-0.5,0.8-0.8,1.3-0.6c1.9,0.7,3.4,2,4.5,3.6c0.3,0.5,0.2,1.1-0.3,1.4 C195,5.8,194.8,5.8,194.6,5.8L194.6,5.8z M185.4,2.1h-5.2c-0.6,0-1-0.5-1-1c0-0.6,0.5-1,1-1h5.2c0.6,0,1,0.5,1,1 C186.4,1.6,185.9,2.1,185.4,2.1L185.4,2.1z M174.9,2.1h-5.2c-0.6,0-1-0.5-1-1c0-0.6,0.5-1,1-1l0,0h5.2c0.6,0,1,0.5,1,1 C175.9,1.6,175.4,2.1,174.9,2.1L174.9,2.1z M164.4,2.1h-5.2c-0.6,0-1-0.5-1-1c0-0.6,0.5-1,1-1h5.2c0.6,0,1,0.5,1,1 C165.4,1.6,165,2.1,164.4,2.1z M153.9,2.1h-5.2c-0.6,0-1-0.5-1-1c0-0.6,0.5-1,1-1h5.2c0.6,0,1,0.5,1,1 C154.9,1.6,154.5,2.1,153.9,2.1z M143.4,2.1h-5.2c-0.6,0-1-0.5-1-1c0-0.6,0.5-1,1-1h5.2c0.6,0,1,0.5,1,1 C144.4,1.6,143.9,2.1,143.4,2.1L143.4,2.1z M132.9,2.1h-5.2c-0.6,0-1-0.5-1-1c0-0.6,0.5-1,1-1l0,0h5.2c0.6,0,1,0.5,1,1 C133.9,1.6,133.5,2.1,132.9,2.1z M122.4,2.1h-5.2c-0.6,0-1-0.5-1-1c0-0.6,0.5-1,1-1h5.2c0.6,0,1,0.5,1,1 C123.4,1.6,123,2.1,122.4,2.1z M111.9,2.1h-5.2c-0.6,0-1-0.5-1-1c0-0.6,0.5-1,1-1h5.2c0.6,0,1,0.5,1,1 C112.9,1.6,112.5,2.1,111.9,2.1z M101.4,2.1h-5.2c-0.6,0-1-0.5-1-1c0-0.6,0.5-1,1-1h5.2c0.6,0,1,0.5,1,1 C102.4,1.6,102,2.1,101.4,2.1z M90.9,2.1h-5.2c-0.6,0-1-0.5-1-1c0-0.6,0.5-1,1-1h5.2c0.6,0,1,0.5,1,1C91.9,1.6,91.5,2.1,90.9,2.1z  M80.4,2.1h-5.3c-0.6,0-1-0.5-1-1c0-0.6,0.5-1,1-1h5.3c0.6,0,1,0.5,1,1C81.4,1.6,81,2.1,80.4,2.1z M69.9,2.1h-5.2c-0.6,0-1-0.5-1-1 c0-0.6,0.5-1,1-1h5.2c0.6,0,1,0.5,1,1C70.9,1.6,70.5,2.1,69.9,2.1z"/>
					<path fill="#A6C1D1" d="M128.9,120.3c0,0-0.7,15.9-3.1,25.7l-14.1,0.2c0,0-1.1-0.7,0.4-1.5c1.6-0.8,5.8-1.6,6.3-2.6 c0.9-1.8,0.6-20.8,0.6-20.8"/>
					<path fill="#A6C1D1" d="M134.4,120.8c0,0,0.7,14.9,3.1,24.6l12.3,0.2c0,0,1.1-0.7-0.4-1.5c-1.6-0.8-5.8-1.6-6.3-2.6 c-0.9-1.8,1.8-21.8,1.8-21.8"/>
					<path fill="#A6C1D1" d="M103.2,45.6c-0.5,0.2-0.8-0.1-1-0.5c-0.8,0.1-1.7,0.2-2.5,0.2c-0.3,0-0.6,0-0.9,0c0.1,1.7,1,3.4,3.3,4.6 l1.7,0.9l2.8-1.7c0.3-2.3-0.2-4-0.7-5.1c-0.7,0.3-1.4,0.6-2.2,0.8C103.5,45.8,103.2,45.6,103.2,45.6z"/>
					<path fill="#A6C1D1" d="M102.2,45.1c-0.7-1.3-0.4-4.5-0.8-4.7c-0.9-0.4-2.8,2.2-2.6,4.9c0.3,0,0.6,0,0.9,0 C100.5,45.3,101.4,45.2,102.2,45.1z"/>
					<path fill="#00A9DE" d="M140.3,98.4c-0.3,0-0.5-0.2-0.5-0.5c0-0.3,0.2-0.5,0.4-0.5l5.7-0.6c0.3,0,0.5,0.1,0.6,0.4 c0,0.3-0.1,0.5-0.4,0.6c0,0,0,0-0.1,0L140.3,98.4L140.3,98.4z"/>
					<path fill="#00A9DE" d="M144.2,101.5c-1,0-1.9-0.3-2.7-1c-0.6-0.6-1-1.4-0.9-2.3c0-0.3,0.2-0.5,0.5-0.5c0,0,0,0,0,0 c0.3,0,0.5,0.3,0.5,0.5c0,0,0,0,0,0c0,0.6,0.2,1.1,0.6,1.5c0.6,0.5,1.4,0.8,2.2,0.7l1-0.3c0.3-0.1,0.6,0.1,0.6,0.4 c0.1,0.3-0.1,0.6-0.4,0.6l0,0l-1.1,0.3C144.5,101.5,144.4,101.5,144.2,101.5z"/>
					<path fill="#004F82" d="M115.8,67.4c-0.3,0-0.5-0.2-0.5-0.5c0-0.2,0.1-0.4,0.3-0.5l4.5-2c0.3-0.1,0.6,0,0.7,0.2c0.1,0.3,0,0.6-0.2,0.7 c0,0,0,0-0.1,0l-4.5,2C115.9,67.4,115.9,67.4,115.8,67.4z"/>
					<path fill="#A6C1D1" d="M126.6,42.1c-1-0.5-1.5-1.6-1.6-2.7l0.2-1.4l-1.9-0.6c0,0.5,0.1,1,0.2,1.4c0.5,2.4,1.1,4.3,3.8,4.8 c0.2,0,0.4,0.2,0.4,0.4l0.3,2.8c0,0.3-0.2,0.5-0.5,0.6h-0.1c-0.1,0-0.2,0-0.3-0.1v1.3l6.5,0.3v-5.8c-0.3,0.1-0.6,0.3-0.9,0.3 C130.1,44.2,128,42.9,126.6,42.1z"/>
					<path fill="#A6C1D1" d="M132.1,38.1l-1.7-4.5c0,0-2.2-1.2-4.3-1.1C127.3,35,129.4,37.4,132.1,38.1z"/>
					<path fill="#A6C1D1" d="M123.5,34.5c-0.1,0.6-0.2,1.2-0.3,1.8l2,0.7l0.2-2.2C125.5,34.8,124.3,34.9,123.5,34.5z"/>
					<path fill="#004F84" d="M136,37.8c-1.2,0.5-2.6,0.6-3.9,0.3c-2.7-0.7-4.9-3.1-5.9-5.6c-0.6-1.4-0.8-2.8-0.6-3.9c-1,0.8-1.9,2.1-2.5,4.1 c0,0.1-0.1,0.3-0.1,0.4c-0.1,0.3-0.2,0.6-0.3,0.9c-0.2-0.1-0.4-0.1-0.6,0c-0.7,0.2-1.5,0.9-1.7,2.1c-0.1,1,0,2.3,0.9,2.9 c0.2,0.1,0.4,0.2,0.7,0.2c0.2,0,0.4,0,0.6-0.1c0,0,0,0.1,0,0.1c0.5,2.5,1.3,4.8,4.3,5.5L127,47c0,0.3,0.2,0.5,0.5,0.5h0.1 c0.3,0,0.5-0.3,0.5-0.6l-0.3-2.8c0-0.2-0.2-0.4-0.4-0.4c-2.7-0.4-3.3-2.3-3.8-4.8c-0.1-0.5-0.2-0.9-0.2-1.4l1.9,0.6l-0.2,1.4 c0,1.1,0.6,2.1,1.6,2.7c1.4,0.8,3.5,2.1,6.2,1.5c0.3-0.1,0.6-0.2,0.9-0.3c1.8-0.9,2.9-3.3,3.2-5.9C136.6,37.5,136.3,37.7,136,37.8z  M121.8,38c-0.2-0.1-0.4-0.6-0.4-1.2l0.9,0.3c0,0.3,0,0.5,0,0.8C122.1,38,121.9,38.1,121.8,38L121.8,38z M122.3,36l-0.8-0.3 c0.1-0.3,0.2-0.5,0.5-0.7c0.1-0.1,0.2-0.1,0.3-0.2c0,0,0.1,0.1,0.2,0.1C122.3,35.4,122.3,35.7,122.3,36L122.3,36z M125.3,37l-2-0.7 c0-0.6,0.1-1.2,0.3-1.8c0.8,0.4,2,0.3,2,0.3L125.3,37z"/>
					<path fill="#74DCFC" d="M127.2,26.5c-0.9,0.4-1.4,1.2-1.6,2.1c-0.7,4.1,4.4,11.7,10.4,9.2c0.3-0.1,0.5-0.2,0.8-0.4 C142.9,33.8,134.5,23.3,127.2,26.5z"/>
					<path fill="#E1EFF9" d="M42.3,95.7h23.1c0.7,0,1.3-0.6,1.3-1.3c0,0,0,0,0-0.1L66,78.9c0-0.5-0.5-0.9-1-0.9H42l0.3,15.7"/>
					<path fill="#C8D7E2" d="M66.8,104c-0.4-2.5-0.6-4.9-0.8-7.4l-0.1-1.9l-0.1-0.9l0-0.2c0-0.1,0-0.2,0-0.3c0-0.3,0.1-0.5,0.3-0.7 c0.3-0.4,0.8-0.6,1.2-0.6l0.9,0l1.9,0l1.9,0l0.9,0c0.5,0,0.9,0.2,1.2,0.6c0.2,0.2,0.3,0.5,0.3,0.7l0,0.5l0,0.9l0.1,1.9 c0.1,2.5,0.2,4.9,0.1,7.4c0,0.1-0.1,0.2-0.2,0.2c-0.1,0-0.2-0.1-0.2-0.2c-0.3-2.5-0.5-4.9-0.7-7.4l-0.1-1.8l-0.1-0.9l0-0.5 c0,0,0-0.1-0.1-0.1c-0.1-0.1-0.3-0.2-0.4-0.2l-0.9,0l-1.9,0l-1.9,0h-0.9c-0.2,0-0.3,0.1-0.4,0.2c0,0,0,0.1-0.1,0.1c0,0,0,0.1,0,0.2 l0,0.2l0,0.9l0.1,1.9c0.1,2.5,0.2,4.9,0,7.4C67,104,66.9,104.1,66.8,104C66.8,104.1,66.8,104,66.8,104L66.8,104z"/>
					<polygon fill="#F3F6F8" points="72.5,101.1 72.1,94.3 68.1,94.3 68.5,101.1 "/>
					<path fill="#E9EFF4" d="M60.3,107.7c0.4-0.2,0.9-0.4,1.4-0.4c0.5,0,0.9-0.1,1.4-0.1c0.5,0,0.9,0,1.4,0.1c0.5,0,0.9,0.1,1.4,0.3 c0.1,0,0.2,0.2,0.1,0.3c0,0.1-0.1,0.1-0.1,0.1c-0.4,0.2-0.9,0.3-1.4,0.3c-0.5,0-0.9,0.1-1.4,0.1c-0.5,0-0.9,0-1.4-0.1 c-0.5,0-1-0.2-1.4-0.4C60.3,107.9,60.3,107.9,60.3,107.7C60.3,107.8,60.3,107.8,60.3,107.7z"/>
					<path fill="#E9EFF4" d="M65.2,103.2c-2.6-0.2-5.3-0.2-7.9-0.3l-4,0l-2,0l-1,0c-0.3,0-0.5-0.1-0.8-0.1c-1.1-0.4-1.8-1.4-1.8-2.5l0-2.7 c-0.4,0-0.7,0-1.1,0l0,2.7c0,1.6,1,3.1,2.5,3.6c0.4,0.1,0.8,0.2,1.2,0.2l1,0l2,0l4,0c2.6-0.1,5.3-0.1,7.9-0.3c0.1,0,0.2-0.1,0.2-0.2 C65.4,103.3,65.3,103.2,65.2,103.2L65.2,103.2z"/>
					<path fill="#E9EFF4" d="M61.4,103.2c-1.3-0.2-2.4-1.2-2.5-2.3c-0.1-0.5,0-1.3,0-2l0-1.5h-1.1l0,1.5c0,0.7,0,1.4,0.1,2.2 c0.2,0.8,0.7,1.5,1.3,2c0.6,0.5,1.4,0.7,2.2,0.6c0.1,0,0.2-0.1,0.2-0.2C61.6,103.3,61.5,103.2,61.4,103.2z"/>
					<path fill="#C8D7E2" d="M66.4,97c-0.3,0.1-0.6,0.1-0.9,0.1h-0.7l0,0h-0.1c-4.3,0-8.7,0.1-13,0.1c-4.7,0.1-9.4,0.2-14,0.3 c-0.1,0-0.1,0-0.1,0.1c0,0.1,0,0.1,0.1,0.1c4.7,0.2,9.4,0.2,14,0.3c4.7,0,9.4,0.1,14,0.1h0c0,0,0.1,0,0.1,0c0.2,0,0.3,0,0.5-0.1 L66.4,97z"/>
					<path fill="#C8D7E2" d="M69.2,91.3l-0.4-9.4l-0.1-2.4c0-0.4,0-0.7-0.1-1.2c-0.2-1.5-1.3-2.6-2.8-2.8c-0.3,0-0.6-0.1-0.9,0 c0,0-0.1,0-0.1,0l-24.4,0.1l-1.5,0c-0.6,0-1.2,0.2-1.7,0.6c-0.5,0.4-0.8,1-0.8,1.6c0,0.6,0,1,0,1.6l0.2,6.1 c0.1,4.1,0.2,8.1,0.4,12.2c0,0.1,0.1,0.2,0.2,0.2c0.1,0,0.2-0.1,0.2-0.2l0,0c0-4.1,0-8.1,0-12.2l0-6.1c0-0.5,0-1.1,0-1.5 c0-0.4,0.2-0.8,0.5-1c0.3-0.3,0.7-0.4,1.1-0.3h0.6l0.3,8.5c0.1,3,0.2,6,0.3,8.9c0,0.1,0.1,0.2,0.2,0.2c0.1,0,0.2-0.1,0.2-0.2l0,0 c0-3,0-6,0-8.9l-0.1-8.4h0l23.9,0.1l0,0h0.3c0.4,0,0.7,0,1.1,0c0.6,0.1,1.2,0.5,1.5,1c0.2,0.3,0.3,0.6,0.3,0.9c0,0.3,0,0.8,0.1,1.1 l0.1,2.3l0.2,4.7l0.2,4.7l0,0.9c0.4,0,0.7,0,1.1,0L69.2,91.3z"/>
					<path fill="#C8D7E2" d="M66.8,104c-0.4-2.5-0.6-4.9-0.8-7.4l-0.1-1.9l-0.1-0.9l0-0.2c0-0.1,0-0.2,0-0.3c0-0.3,0.1-0.5,0.3-0.7 c0.3-0.4,0.8-0.6,1.2-0.6l0.9,0l1.9,0l1.9,0l0.9,0c0.5,0,0.9,0.2,1.2,0.6c0.2,0.2,0.3,0.5,0.3,0.7l0,0.5l0,0.9l0.1,1.9 c0.1,2.5,0.2,4.9,0.1,7.4c0,0.1-0.1,0.2-0.2,0.2c-0.1,0-0.2-0.1-0.2-0.2c-0.3-2.5-0.5-4.9-0.7-7.4l-0.1-1.8l-0.1-0.9l0-0.5 c0,0,0-0.1-0.1-0.1c-0.1-0.1-0.3-0.2-0.4-0.2l-0.9,0l-1.9,0l-1.9,0h-0.9c-0.2,0-0.3,0.1-0.4,0.2c0,0,0,0.1-0.1,0.1c0,0,0,0.1,0,0.2 l0,0.2l0,0.9l0.1,1.9c0.1,2.5,0.2,4.9,0,7.4C67,104,66.9,104.1,66.8,104C66.8,104.1,66.8,104,66.8,104L66.8,104z"/>
					<polygon fill="#F3F6F8" points="72.5,101.1 72.1,94.3 68.1,94.3 68.5,101.1 "/>
					<path fill="#E9EFF4" d="M60.3,107.7c0.4-0.2,0.9-0.4,1.4-0.4c0.5,0,0.9-0.1,1.4-0.1c0.5,0,0.9,0,1.4,0.1c0.5,0,0.9,0.1,1.4,0.3 c0.1,0,0.2,0.2,0.1,0.3c0,0.1-0.1,0.1-0.1,0.1c-0.4,0.2-0.9,0.3-1.4,0.3c-0.5,0-0.9,0.1-1.4,0.1c-0.5,0-0.9,0-1.4-0.1 c-0.5,0-1-0.2-1.4-0.4C60.3,107.9,60.3,107.9,60.3,107.7C60.3,107.8,60.3,107.8,60.3,107.7z"/>
					<path fill="#E9EFF4" d="M0.2,147.4c20-0.6,39.9-0.7,59.9-0.8l59.9-0.1c39.9,0.1,79.8,0.1,119.7,0.8c0.2,0,0.4,0.2,0.4,0.4 c0,0.2-0.2,0.4-0.4,0.4c-39.9,0.7-79.8,0.6-119.7,0.8l-59.9-0.1c-20-0.1-39.9-0.3-59.9-0.8c-0.1,0-0.2-0.1-0.2-0.2 C0,147.5,0.1,147.4,0.2,147.4L0.2,147.4z"/>
					<path fill="#004F82" d="M119.1,140.9c-0.3,0-0.5-0.2-0.5-0.5c0-0.1,0-0.1,0-0.1c0.7-2.5,0.4-7.5,0.1-12.3c-0.2-2.4-0.3-4.6-0.3-6.6 c0-0.3,0.2-0.5,0.5-0.5c0,0,0,0,0,0l0,0c0.3,0,0.5,0.2,0.5,0.5c0,1.9,0.2,4.2,0.3,6.5c0.3,4.9,0.7,10-0.2,12.7 C119.5,140.8,119.3,140.9,119.1,140.9z"/>
					<path fill="#004F82" d="M137.5,146c-0.3,0-0.5-0.2-0.5-0.4c0-0.1-1.9-12.5-3.1-24.7c0-0.3,0.1-0.5,0.4-0.6c0.3,0,0.5,0.1,0.6,0.4 c0,0,0,0,0,0.1c1.3,12.2,3.1,24.5,3.1,24.6C138.1,145.7,137.9,145.9,137.5,146C137.6,146,137.5,146,137.5,146z"/>
					<path fill="#E1EFF9" d="M195,10.8V9.8c0-0.6,0.5-1,1-1c0.6,0,1,0.5,1,1l0,0v1.1"/>
					<path fill="#A6C1D1" d="M160,33.1v-0.3c-0.4,0.3-0.9,0.6-1.4,0.7c0,0,1.2-4.2-0.1-4.5s-5.9,8-5.9,8l1.7,4.1c0,0,1.8-1.6,7.7-4.6 c1.3-1.2,2.1-2.4,2.5-3.4L160,33.1z"/>
					<path fill="#004F82" d="M157.5,39.3c-0.3,0-0.5-0.3-0.5-0.5c0-0.3,0.2-0.5,0.5-0.5c0.6,0,4.6-2.1,6.6-5.9c0.1-0.3,0.4-0.4,0.7-0.2 c0.3,0.1,0.4,0.4,0.2,0.7c0,0,0,0,0,0C163,36.8,158.6,39.3,157.5,39.3z"/>
					<path fill="#004F82" d="M154.4,36c-0.3,0-0.5-0.2-0.5-0.5c0-0.1,0.1-0.3,0.2-0.4c0.4-0.4,1.1-1.8,1.7-3c1.2-2.5,1.8-3.5,2.5-3.6 c0.3,0,0.5,0.1,0.7,0.3c0.7,0.8,0.5,2.8,0.3,4.1c0.4-0.2,0.9-0.5,1.2-0.8c0.2-0.2,0.5-0.3,0.7-0.2c0.2,0.2,0.3,0.5,0.2,0.7 c0,0,0,0,0,0c-0.8,1.1-2.5,1.5-2.6,1.5c-0.3,0.1-0.6-0.1-0.6-0.4c0-0.1,0-0.1,0-0.2c0.3-1.2,0.5-3.1,0.2-3.8 c-0.4,0.5-1.1,1.9-1.6,2.9c-0.7,1.5-1.4,2.8-2,3.3C154.6,35.9,154.5,36,154.4,36z"/>
					<path fill="#E1EFF9" d="M66.7,21.8h-5.1c-0.6,0-1,0.5-1,1c0,0.6,0.5,1,1,1h5.1c0.6,0,1-0.5,1-1C67.8,22.3,67.3,21.8,66.7,21.8z"/>
					<path fill="#E1EFF9" d="M76.9,21.8h-5.1c-0.6,0-1,0.5-1,1c0,0.6,0.5,1,1,1h5.1c0.6,0,1-0.5,1-1C77.9,22.3,77.4,21.8,76.9,21.8z"/>
					<path fill="#E1EFF9" d="M127.6,21.8h-5.1c-0.6,0-1,0.5-1,1c0,0.6,0.5,1,1,1l0,0h5.1c0.6,0,1-0.5,1-1C128.6,22.3,128.1,21.8,127.6,21.8z "/>
					<path fill="#E1EFF9" d="M142.8,21.8c-0.6,0-1,0.5-1,1c0,0.6,0.5,1,1,1h1.2v-2.1H142.8z"/>
					<path fill="#E1EFF9" d="M137.7,21h-5.1c-0.6,0-1,0.5-1,1c0,0.6,0.5,1,1,1h5.1c0.6,0,1-0.5,1-1C138.7,21.4,138.3,21,137.7,21z"/>
					<path fill="#E1EFF9" d="M87,21.8h-5.1c-0.6,0-1,0.5-1,1c0,0.6,0.5,1,1,1h4.2c0.3-0.7,0.7-1.4,1.2-2C87.2,21.9,87.1,21.8,87,21.8z"/>
					<path fill="#E1EFF9" d="M117.4,21.8h-5.1c-0.1,0-0.2,0-0.3,0c0.4,0.6,0.8,1.3,1.2,2h4.2c0.6,0,1-0.5,1-1 C118.4,22.3,118,21.8,117.4,21.8L117.4,21.8z"/>
					<path fill="#004F82" d="M103.5,44.8l-0.3,0.1c0,0.2-0.1,0.3-0.2,0.3c-0.1,0-0.2,0-0.2,0c-0.1-0.1-0.1-0.1-0.2-0.2 c-0.3-0.5-0.4-1.9-0.5-2.7c-0.1-1.3-0.1-2-0.7-2.2c-0.8-0.3-1.9,0.5-2.7,2.1c-0.5,1-0.7,2-0.7,3.1c0.1,1.9,1,3.9,3.6,5.2 c0.1,0,0.2,0.1,0.2,0.1c0.3,0,0.5-0.2,0.5-0.5c0-0.2-0.1-0.4-0.3-0.5c-3.7-1.9-3.1-5-2.7-6.3c0.4-1.4,1.2-2.1,1.5-2.3 c0.1,0.4,0.1,0.9,0.1,1.3c0.1,1.5,0.2,3.2,1.1,3.7c0.3,0.2,0.7,0.3,1.1,0.1c0.8-0.3,0.9-0.8,0.9-1.6c-0.1,0-0.2,0.1-0.4,0.1l-0.2,0 L103.5,44.8z"/>
					<path fill="#004F82" d="M103.7,44.8l0.2,0l-0.3,0.1L103.7,44.8z"/>
					<path fill="#004F82" d="M105.8,44L105.8,44c-0.3,0.1-0.5,0.2-0.6,0.3c0.5,1.2,0.7,2.4,0.7,3.7c0,0.3,0.2,0.5,0.5,0.5l0,0 c0.3,0,0.5-0.2,0.5-0.5c0-1.4-0.2-2.8-0.8-4.1l-0.2,0.1L105.8,44z"/>
					<path fill="#004F82" d="M106,43.9l-0.3,0.1l0.1,0L106,43.9z"/>
					<path fill="#00A9DE" d="M121.4,121.9c-1.8,0-3.3-0.2-4.2-0.9c-0.4-0.3-0.7-0.8-0.7-1.3c0-0.5-0.1-1.1-0.2-2c-0.5-5.2-1.5-17.5,0.7-31.5 c0.1-0.3,0.3-0.5,0.6-0.4c0.3,0.1,0.4,0.3,0.4,0.6c-2.2,13.8-1.1,26-0.7,31.2c0.1,0.9,0.1,1.6,0.2,2c0,0.2,0.1,0.4,0.3,0.6 c1.8,1.4,8.9,0.3,11.5-0.3c0.3,0,0.5,0.1,0.6,0.4c0,0.3-0.1,0.5-0.4,0.6C128.9,121.1,124.8,121.9,121.4,121.9z"/>
					<path fill="#00A9DE" d="M136.2,121.2c-1.9,0-3.5-0.2-4.2-0.7c-1.6-1.1-1.3-15.6-1.1-21.8c0-0.3,0.2-0.5,0.5-0.5c0,0,0,0,0.1,0 c0.3,0,0.5,0.2,0.5,0.5c-0.3,9.6-0.2,20,0.6,20.9c1.4,0.9,8.9,0.3,13.7-0.4l-0.9-15.7c0-0.3,0.2-0.5,0.5-0.5c0.3,0,0.5,0.2,0.5,0.4 c0,0,0,0,0,0.1l0.9,16.2c0,0.3-0.2,0.5-0.4,0.5C145.9,120.4,140.3,121.2,136.2,121.2z"/>
					<path fill="#00A9DE" d="M145.1,95.6c-0.3,0-0.5-0.2-0.5-0.5l-1.1-13.6c0-0.3,0.2-0.5,0.5-0.6c0.3,0,0.5,0.2,0.6,0.5l1.1,13.6 C145.6,95.3,145.4,95.6,145.1,95.6L145.1,95.6z"/>
					<path fill="#74DCFC" d="M158.9,40.1l-5-5.1c-2.4,4.9-9.6,12.1-15.1,13.4c-0.1,0-0.3-0.1-0.4-0.2c-1.7-0.6-11.7-1.3-14.1-0.3 c-1.5,0.7-2.6,1.2-3.3,1.8c-4.7,3.7-7.7,6.9-7.7,6.9l-5.8-9l-5.1,3.7c0,0,4.4,16.2,11.2,15.8c2.2-0.1,4.4-0.7,6.4-1.7l0.6,16.3 l22.8-0.4L142.9,58C151.4,53.7,158.9,40.1,158.9,40.1z"/>
					<path fill="#004F82" d="M119.6,82.2c-0.3,0-0.5-0.3-0.5-0.5c0-0.3,0.2-0.5,0.5-0.5l24.4-0.2c0.3,0,0.5,0.2,0.5,0.5c0,0,0,0,0,0 c0,0.3-0.2,0.5-0.5,0.5L119.6,82.2L119.6,82.2z"/>
					<path fill="#004F82" d="M115.8,67.4c-0.3,0-0.5-0.2-0.5-0.5c0-0.2,0.1-0.4,0.3-0.5l4.5-2c0.3-0.1,0.6,0,0.7,0.2c0.1,0.3,0,0.6-0.2,0.7 c0,0,0,0-0.1,0l-4.5,2C115.9,67.4,115.9,67.4,115.8,67.4z"/>
					<path fill="#C8D7E2" d="M93.2,112.1L93.2,112.1l-14.9,0.2l-15,0.2l-30.1,0.1c-0.3,0-0.6-0.3-0.6-0.6l0,0l0-8.4c0-0.3,0.3-0.6,0.6-0.6 h0l0,0l29.9,0.1l29.9,0.2l0,0c0.2,0,0.3,0.1,0.3,0.3c0,0,0,0,0,0l0,0L93.2,112.1z M92.9,112L92.9,112l-0.2-8.3l0.3,0.3l-29.9,0.2 l-29.9,0.1l0.6-0.6l0,8.4l-0.6-0.6l29.7,0.1l14.9,0.2L92.9,112z"/>
					<path fill="#C8D7E2" d="M33.4,108.9c0.3,3.1,0.3,6.1,0.4,9.2l0.1,9.2c-0.1,6.1,0,12.2-0.4,18.3c0,0.1-0.1,0.2-0.2,0.2 c-0.1,0-0.2-0.1-0.2-0.2c-0.4-6.1-0.3-12.2-0.4-18.3l0.1-9.2c0.1-3.1,0.1-6.1,0.4-9.2c0-0.1,0-0.1,0.1-0.1 C33.3,108.8,33.4,108.9,33.4,108.9L33.4,108.9z"/>
					<path fill="#C8D7E2" d="M93.2,112c0.3,2.8,0.3,5.6,0.4,8.4l0.1,8.4c-0.1,5.6,0,11.2-0.4,16.8c0,0.1-0.1,0.2-0.2,0.2 c-0.1,0-0.2-0.1-0.2-0.2c-0.4-5.6-0.3-11.2-0.4-16.8l0.1-8.4c0.1-2.8,0.1-5.6,0.4-8.4c0-0.1,0-0.1,0.1-0.1 C93.1,111.9,93.2,112,93.2,112L93.2,112z"/>
				</svg>
				<p>
					{ __( 'With Jetpack Premium, you can create the perfect site, no matter its purpose. Customize your site’s' +
						' appearance with one of more than 200 free themes, or enhance your content with up to 13 GB of HD video ' +
						'-- all hosted free of ads or watermarks.'
					) }
				</p>
				<svg className="jp-welcome__svg" id="wordAds" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 240 121">
					<path fill="#E9EFF4" d="M226.3,118.6c-37.7-0.8-75.4-0.7-113-0.9l-36.1,0.1c0,0.3,0,0.6,0,0.9c0,0.2-0.2,0.4-0.4,0.4 c-3.8-0.2-7.6-0.2-11.4-0.2c-13.8,0-27.6-0.3-41.4-0.3c-0.2,0-0.3-0.1-0.3-0.3c0,0,0,0,0,0c-7.8,0.1-15.6,0.3-23.4,0.6 c-0.1,0-0.2,0.1-0.2,0.3c0,0.1,0.1,0.2,0.2,0.2c18.8,0.7,37.7,0.8,56.5,1l56.5,0.2c37.7-0.1,75.4-0.1,113-0.9c0.3,0,0.5-0.2,0.5-0.5 C226.8,118.8,226.6,118.6,226.3,118.6L226.3,118.6z"/>
					<path fill="#C2F4FF" d="M66.4,35.6h108.2l0,0v41.5l0,0h-110l0,0V37.5C64.5,36.4,65.3,35.6,66.4,35.6z"/>
					<path fill="#00A9DE" d="M164.1,89.3h-16.8c-1,0-1.9,0.8-1.9,1.9l0,0v26.7h29.1V92.2c-8.8,3.5-15.9,5.9-15.9,5.9S161.9,95,164.1,89.3z"/>
					<path fill="#FCD56E" d="M229,45.1h-71.4c-6.1,0-11,4.9-11,11v20.2c0,6.1,4.9,11,11,11h7.2c-0.2,0.7-0.5,1.4-0.7,2.1 c-2.2,5.7-5.5,8.8-5.5,8.8s7.1-2.4,15.9-5.9c3.7-1.5,7.8-3.2,11.8-4.9H229c6.1,0,11-4.9,11-11V56.1C240,50,235.1,45.1,229,45.1z"/>
					<polygon fill="#C2F4FF" points="77.1,89.3 77.2,117.9 133.5,117.9 133.5,89.3 "/>
					<path fill="#C8D7E2" d="M77.1,84.3L77.1,84.3c-18-0.2-35.9-0.1-53.9-0.2l0,0c-0.4,0-0.7,0.3-0.7,0.7c0,0,0,0,0,0l0.2,34.3l0,0 c0,0.3,0.3,0.6,0.6,0.6c0,0,0,0,0,0l27.1-0.2l26.8-0.3h0.1l0.2-34.4C77.6,84.6,77.4,84.3,77.1,84.3C77.1,84.3,77.1,84.3,77.1,84.3z  M50.1,118.7l-26.1-0.2l0-33c17.6-0.1,35.1,0,52.7-0.2L77,119v0.1L50.1,118.7z"/>
					<polyline fill="#FFFFFF" points="25.3,88.1 49.5,102.8 75.2,87.2 "/>
					<path fill="#C8D7E2" d="M25.4,88c2.1,1.1,4.2,2.2,6.3,3.4s4.1,2.3,6.1,3.6l6.1,3.6c2,1.2,4,2.5,6,3.7h-0.7l12.9-7.7 c4.3-2.6,8.6-5.1,13-7.6c0.1-0.1,0.3,0,0.3,0.1c0.1,0.1,0,0.2-0.1,0.3c-4.2,2.7-8.4,5.4-12.7,8.1l-12.8,7.9c-0.2,0.1-0.5,0.1-0.7,0 c-2-1.2-4.1-2.4-6.1-3.6l-6-3.7c-2-1.2-4-2.5-6-3.8c-2-1.3-3.9-2.6-5.9-4c-0.1,0-0.1-0.1,0-0.2C25.3,88,25.3,88,25.4,88L25.4,88z"/>
					<polygon fill="#00A9DE" points="81.7,65 92.5,49.2 104.8,65 "/>
					<polygon fill="#FFFFFF" points="194.2,55.7 196.1,54.6 197.5,56.2 199.5,55.8 200.4,57.7 202.5,57.9 202.8,60 204.7,60.9 204.3,63  205.8,64.4 204.8,66.2 205.8,68.1 204.3,69.5 204.7,71.5 202.8,72.4 202.5,74.5 200.4,74.8 199.5,76.7 197.5,76.3 196.1,77.8  194.2,76.8 192.4,77.8 191,76.3 188.9,76.7 188,74.8 185.9,74.5 185.7,72.4 183.8,71.5 184.2,69.5 182.6,68.1 183.7,66.2  182.6,64.4 184.2,63 183.8,60.9 185.7,60 185.9,57.9 188,57.7 188.9,55.8 191,56.2 192.4,54.6 "/>
					<polygon fill="#C8D7E2" points="48.5,84.8 50.2,84.8 51,22.9 49.2,22.9 "/>
					<rect x="186.5" y="22.9" fill="#C8D7E2" width="1.8" height="22.1"/>
					<path fill="#C8D7E2" d="M186.5,87.3v29.8H77.1c0,0.6,0.1,1.2,0,1.8h110.2c0.5,0,0.9-0.4,0.9-0.9V87.3H186.5z"/>
					<path fill="#74DCFC" d="M49.3,23.2V9.7c0-5.4,3.7-9.7,8.2-9.7h122.8c4.5,0,8.2,4.3,8.2,9.7v13.5H49.3z"/>
					<path fill="#004F84" d="M191.1,23.2c-12.1,1-24.2,0.9-36.3,0.9l-36.3,0.2l-36.3-0.2c-12.1-0.1-24.2,0-36.3-0.9v-0.6 c12.1-1,24.2-0.9,36.3-0.9l36.3-0.2l36.3,0.2c12.1,0.1,24.2,0,36.3,0.9V23.2z"/>
				</svg>
				<p>
					{ __( 'Using Jetpack’s powerful sharing tools, you can automatically share your newest posts on social media,' +
						' or schedule your content to be re-shared at any date or time you choose. And along with growing your ' +
						'following, you can grow your business with tools like payment buttons and ads.'
					) }
				</p>
				<svg className="jp-welcome__svg" id="security" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 240 136">
					<path fill="#E3EAF0" d="M0.3,129.7c14.5-0.7,29-0.9,43.4-1.1l21.7-0.1l21.7,0l43.4,0.2c14.5,0.1,29,0.3,43.4,0.8c0.3,0,0.5,0.2,0.5,0.5 s-0.2,0.5-0.5,0.5c-14.5,0.5-29,0.6-43.4,0.8l-43.4,0.2l-21.7,0l-21.7-0.1c-14.5-0.2-29-0.3-43.4-1.1c-0.1,0-0.3-0.1-0.3-0.3 C0,129.8,0.1,129.7,0.3,129.7L0.3,129.7z"/>
					<path fill="#E3EAF0" d="M200.3,129.7c3.3-0.7,6.5-0.9,9.8-1.1l4.9-0.1l4.9,0c3.3,0,6.5,0.1,9.8,0.2c3.3,0.1,6.5,0.3,9.8,0.8 c0.3,0,0.5,0.3,0.5,0.6c0,0.2-0.2,0.4-0.5,0.5c-3.3,0.5-6.5,0.7-9.8,0.8s-6.5,0.2-9.8,0.2l-4.9,0l-4.9-0.1c-3.3-0.1-6.5-0.4-9.8-1.1 c-0.1,0-0.2-0.2-0.2-0.3C200.1,129.8,200.2,129.7,200.3,129.7L200.3,129.7z"/>
					<polyline fill="#B6F1FF" points="60.4,107.8 60.4,32.4 152.4,32.4 152.4,107.8 65.4,107.8 "/>
					<polyline fill="#65D3FA" points="60.4,32 60.4,14.4 189.2,14.4 189.2,32 67.4,32 "/>
					<polyline fill="#74DCFC" points="189.2,32.8 190.4,107.5 152.4,107.7 152.4,32.8 189.2,32.8 "/>
					<polyline fill="#FFFFFF" points="134.4,107.7 71.1,107.7 71.1,65.8 140.8,65.8 140.8,107.7 "/>
					<polyline fill="#FFFFFF" points="140.8,61.1 71.1,61.1 71.1,43.9 140.8,43.9 140.8,61.1 "/>
					<path fill="#BBCDDA" d="M125.9,54.1c-1,0.2-1.9,0.6-2.7,1.1c-0.8,0.5-1.7,0.9-2.5,1.5c-0.6,0.4-1.2,0.8-1.8,1.2 c0.6-0.7,1.2-1.4,1.7-2.1c0.7-0.8,1.3-1.7,1.9-2.6c0.6-0.9,1.1-1.9,1.5-2.9c0-0.1,0-0.2-0.1-0.2c0,0-0.1,0-0.1,0 c-0.9,0.6-1.7,1.4-2.4,2.2c-0.7,0.8-1.4,1.6-2,2.5c-0.6,0.8-1.2,1.6-1.7,2.4c0.3-0.9,0.6-1.9,0.9-2.8c0.3-1,0.5-2,0.8-3.1 c0.3-1,0.4-2.1,0.3-3.2c0,0,0-0.1-0.1-0.1c-0.1,0-0.1,0-0.2,0c0,0,0,0,0,0c-0.6,0.9-1,1.9-1.4,2.9c-0.3,1-0.7,2-0.9,3 c-0.2,0.8-0.4,1.6-0.6,2.3c0-1-0.1-1.9-0.1-2.9c-0.1-1.1-0.2-2.3-0.3-3.4c-0.1-1.1-0.3-2.3-0.6-3.4c0-0.1-0.2-0.2-0.3-0.2 c-0.1,0-0.2,0.1-0.2,0.2c-0.1,1.1-0.2,2.3-0.1,3.4c0,1.1,0.1,2.3,0.1,3.4c0.1,1.1,0.2,2.3,0.3,3.4v0.1c-0.3-0.7-0.6-1.4-1-2.1 c-0.4-0.8-0.9-1.7-1.4-2.5c-0.5-0.8-1-1.6-1.6-2.4c-0.1-0.1-0.3-0.1-0.4,0c-0.1,0.1-0.1,0.2-0.1,0.3c0.2,0.9,0.5,1.8,0.9,2.7 c0.4,0.9,0.8,1.7,1.2,2.6c0.2,0.4,0.4,0.8,0.6,1.2c-0.7-0.7-1.3-1.4-2-2.1c-0.9-0.8-1.7-1.6-2.6-2.4c-0.9-0.8-1.8-1.6-2.8-2.2 c-0.1-0.1-0.3,0-0.4,0.1c-0.1,0.1-0.1,0.2,0,0.3c0.7,1,1.5,1.9,2.3,2.8c0.8,0.9,1.7,1.7,2.5,2.6c0.8,0.8,1.7,1.7,2.6,2.5l0.1,0.1 c-0.5-0.2-1.1-0.5-1.6-0.7c-0.8-0.3-1.6-0.6-2.4-0.9c-0.8-0.3-1.7-0.5-2.6-0.6c-0.1,0-0.3,0.1-0.3,0.2c0,0.1,0,0.2,0.1,0.3 c0.7,0.5,1.5,1,2.3,1.3c0.8,0.4,1.6,0.7,2.4,1.1c0.8,0.3,1.6,0.6,2.4,0.9c0.8,0.3,1.6,0.4,2.5,0.5c0,0,0,0,0.1,0.1l0,0 c0.1,0.1,0.2,0.1,0.2,0c0.9-0.3,1.8-0.7,2.7-1.2c0.8-0.5,1.7-1,2.5-1.5c0.8-0.5,1.6-1,2.4-1.6c0.8-0.6,1.5-1.2,2.2-2 c0,0,0-0.1,0-0.1C126,54.2,126,54.1,125.9,54.1z"/>
					<path fill="#0E6FB1" d="M193.6,32.3c-11.4,1.1-22.9,1.1-34.3,1.2L125,34l-34.3,0c-11.4,0-22.9,0.1-34.3-0.9v-0.7 c11.4-1.1,22.9-1.1,34.3-1.2l34.3-0.4l34.3,0c11.4,0,22.9-0.1,34.3,0.9L193.6,32.3z"/>
					<path fill="#BBCDDA" d="M101.3,91.2c-1.4,0.8-2.7,1.8-3.8,2.9c0.1-0.5,0.2-1,0.4-1.5c0.5-2.3,1.3-4.4,2.1-6.7l-0.5-0.3 c-0.8,1-1.4,2-1.9,3.1c-0.5,1.1-0.9,2.3-1.2,3.4c-0.3,1.2-0.5,2.4-0.6,3.6c0,0.3-0.1,0.7-0.1,1c-0.3,0.8-0.4,1.8-0.1,2.6h0.3 l0.1-0.2c0,0.1,0,0.1,0,0.2h0.3c0.2-0.6,0.4-1.2,0.5-1.8c0.1-0.1,0.1-0.3,0.2-0.4c0.4-0.7,0.9-1.3,1.4-1.9c0.5-0.6,1.1-1.2,1.7-1.8 s1.2-1.2,1.7-2L101.3,91.2z"/>
					<path fill="#BBCDDA" d="M133.6,77.6c-0.6-1.1-1.8-2.6-3.7-3.2c-0.9-0.3-1.7-0.4-2.6-0.3c0.4-0.5,0.8-0.9,1.2-1.4l-0.4-0.4 c-0.8,0.6-1.5,1.3-2.2,2c-0.6,0.2-1.3,0.4-1.9,0.7c-0.2-1.3-0.8-3-2.4-4.3c-1.1-0.9-2.4-1.4-3.9-1.5c-1.5-0.2-2.8,0.9-3,2.4 c0,0.3,0,0.7,0.1,1c0.4,1.4,1.2,2.7,2.3,3.6c1.3,1.1,3,1.7,4.8,1.7c0.4,0,0.8,0,1.1-0.1c-1.3,2-2.4,4.1-3.2,6.3l-0.1,0.1 c-0.2-1.3-0.9-3.7-3.3-5c-1.4-0.8-3-1.1-4.7-0.9c-1.3,0.2-2.3,1.4-2.1,2.7c0,0.2,0.1,0.3,0.1,0.5c0.5,1.6,1.6,2.9,3.1,3.8 c1.2,0.7,2.5,1,3.8,1c0.7,0,1.5-0.1,2.1-0.3c0.1,0.1,0.1,0.2,0.2,0.4c-0.6,2.2-1.1,4.4-1.3,6.6c-0.3-0.7-1.8-3.7-5.1-4.3 c-1.6-0.3-3.2,0-4.7,0.7c-1.2,0.6-1.7,2-1.1,3.2c0.1,0.2,0.2,0.3,0.3,0.4c1,1.3,2.5,2.2,4.2,2.5c0.5,0.1,0.9,0.1,1.4,0.1 c1.5,0,3-0.5,4.3-1.3l-0.2,0.2l0.2,0.4c0.1,0.2,0.3,0.4,0.4,0.6c-0.1,2,0,4,0.2,6h0.3c0.2-1.6,0.4-3.3,0.6-4.9 c1.2,1,2.8,1.6,4.4,1.6h0c1.6,0,3.1-0.5,4.3-1.4l0,0c0.6-0.4,1-1.1,1-1.8c0.1-0.7-0.2-1.4-0.8-1.9c-0.9-0.9-2.5-1.9-4.5-1.9h0 c-1.4,0-2.7,0.4-3.9,1.2c0.3-1.6,0.6-3.1,1-4.7c1.1,1.1,2.6,1.7,4.1,1.8c0.2,0,0.4,0,0.6,0c1.3,0,2.7-0.4,3.8-1 c0.6-0.4,1.1-1,1.2-1.7c0.1-0.7-0.1-1.5-0.6-2c-0.9-0.9-2.3-2.1-4.4-2.3c-1.1-0.1-2.2,0.1-3.2,0.5c0.6-1.4,1.2-2.7,2-3.9 c0.1-0.2,0.2-0.3,0.3-0.5c0.8,1.2,2.1,2.2,3.5,2.6c0.8,0.3,1.6,0.4,2.4,0.4c0.7,0,1.4-0.1,2.1-0.3c0.7-0.2,1.3-0.7,1.6-1.4 C134,79,134,78.2,133.6,77.6z M113.7,83.9c-1.2-0.7-2-1.7-2.5-3.1c-0.2-0.6,0.1-1.2,0.7-1.4c0.1,0,0.2,0,0.2-0.1c0.3,0,0.5,0,0.8,0 c1.1,0,2.1,0.3,3,0.8c2,1.2,2.5,3.4,2.7,4.4C116.9,85,115.1,84.8,113.7,83.9z M111.7,94.1c-1.3-0.2-2.5-0.9-3.4-2 c-0.4-0.5-0.3-1.2,0.2-1.5c0.1,0,0.1-0.1,0.2-0.1c0.9-0.4,1.9-0.7,2.8-0.7c0.3,0,0.7,0,1,0.1c2.3,0.4,3.5,2.4,4,3.2 C115.1,94,113.4,94.4,111.7,94.1L111.7,94.1z M123.3,92.3L123.3,92.3c1.7,0,2.9,0.8,3.7,1.5c0.2,0.2,0.4,0.6,0.3,0.9 c0,0.3-0.2,0.7-0.5,0.8c-1.1,0.7-2.3,1.1-3.6,1.1h0c-2.1,0-3.5-1.1-4.2-1.9c0-0.3,0.1-0.5,0.1-0.8C119.9,93.3,121.3,92.3,123.3,92.3 L123.3,92.3z M125,83.6c1.6,0.1,2.8,1.1,3.5,1.8c0.2,0.2,0.3,0.6,0.3,0.9c-0.1,0.3-0.3,0.6-0.6,0.8l0,0c-1.1,0.6-2.4,0.9-3.7,0.8 c-1.5-0.1-2.9-0.8-3.8-2l0-0.1c0.1-0.4,0.3-0.9,0.4-1.3C122.3,83.9,123.7,83.6,125,83.6L125,83.6z M122.8,76.3 c-1.7,0.2-3.4-0.3-4.8-1.3c-0.9-0.7-1.6-1.7-1.9-2.9c-0.2-0.7,0.2-1.5,1-1.7c0.1,0,0.2-0.1,0.4-0.1c0.1,0,0.1,0,0.2,0 c1.2,0.1,2.3,0.5,3.2,1.3C122.7,73.1,122.9,75.4,122.8,76.3L122.8,76.3z M132.6,79.2c-0.1,0.3-0.4,0.6-0.7,0.6 c-1.2,0.4-2.5,0.3-3.8-0.1c-1.3-0.4-2.4-1.4-3.1-2.6c0.4-0.6,0.8-1.1,1.2-1.6c1.1-0.3,2.3-0.3,3.4,0.1c1.6,0.5,2.5,1.7,3,2.6 C132.7,78.5,132.7,78.9,132.6,79.2L132.6,79.2z"/>
					<path fill="#7BDEBF" d="M201.6,63.5c0,0-10.1,12.5-27.4,11c0,0-9.3,49.8,28.6,60.5c0,0,36.9-5.1,29.5-60.5
						C232.2,74.5,211.4,76.1,201.6,63.5z"/>
					<path fill="#073C6E" d="M233.7,74.3c-0.1-0.6-0.6-1.1-1.3-1.1h0c-2.8,0-5.5-0.2-8.3-0.7c-2.7-0.4-5.5-1.1-8.1-2c-2.6-0.9-5.1-2-7.4-3.5 c-2.3-1.4-4.3-3.3-6-5.4c0-0.1-0.1-0.1-0.2-0.2c-0.5-0.4-1.3-0.4-1.7,0.1l0,0c-1.6,1.9-3.6,3.7-5.7,5.2c-2.1,1.5-4.3,2.9-6.7,3.9 c-2.3,1.1-4.8,1.8-7.4,2.3c-2.5,0.5-5.1,0.6-7.7,0.4h-0.1c-0.5,0-1,0.3-1,0.8c-1,6.2-1.1,12.4-0.7,18.6c0.4,6.2,1.6,12.4,3.8,18.2 c2.2,5.8,5.6,11.2,10.2,15.5c4.6,4.3,10.3,7.1,16.2,8.7c0,0,0.1,0,0.1,0h0c3.2-0.1,6.4-1,9.3-2.3c2.9-1.3,5.7-3.1,8.2-5.2 c4.9-4.2,8.8-9.7,11.2-15.7c2.6-6,3.6-12.4,4.1-18.8C235,87,234.6,80.6,233.7,74.3z M231.7,93.2c-0.3,3.1-0.6,6.1-1.3,9.1 c-0.3,1.5-0.7,3-1.1,4.4c-0.5,1.4-0.9,2.9-1.5,4.3c-2.2,5.6-5.7,10.8-10.2,14.8c-4.6,3.9-9.9,6.9-15.8,8.9 c-5.8-1.7-11.2-4.7-15.6-8.9c-4.4-4.2-7.5-9.5-9.5-15.2c-2-5.7-3.1-11.7-3.4-17.8c-0.3-5.7-0.1-11.5,0.8-17.2c2.4,0.2,4.9,0,7.3-0.4 c2.7-0.5,5.4-1.3,7.9-2.4c2.5-1.1,4.9-2.5,7.1-4.1c1.9-1.3,3.6-2.8,5.2-4.5c1.7,1.9,3.6,3.5,5.7,4.9c2.5,1.6,5.2,2.9,8,3.8 c2.8,0.9,5.6,1.6,8.5,2.1c2.5,0.4,5,0.7,7.6,0.7C231.9,81.6,232.2,87.4,231.7,93.2L231.7,93.2z"/>
					<polyline fill="#7BDEBF" points="190.5,102 200.3,109.7 220.1,87.3 "/>
					<path fill="#073C6E" d="M220.4,87.1c-0.2-0.2-0.4-0.2-0.6-0.1c0,0,0,0,0,0c-2,1.6-3.8,3.3-5.5,5.1c-1.8,1.8-3.4,3.6-5.1,5.5 c-3,3.3-6.1,6.7-9.1,10.1c-1.3-1-2.6-2-3.8-2.9l-2.5-1.9c-0.9-0.6-1.5-1.4-2.7-1.6c-0.2,0-0.3,0-0.5,0.1c-0.5,0.2-0.8,0.8-0.6,1.3 c0.4,1.1,1.4,1.6,2.1,2.3l2.4,2c1.6,1.3,3.2,2.7,4.8,3.9l0,0c0.6,0.5,1.5,0.4,2-0.2c3.3-3.7,6.6-7.5,9.8-11.3 c1.6-1.9,3.3-3.8,4.8-5.7c1.6-2,3.1-4,4.4-6.1C220.5,87.4,220.5,87.2,220.4,87.1z"/>
					<path fill="#BBCDDA" d="M179.9,129.9c-6.5-0.3-13.1-0.5-19.6-0.6c-6.5-0.2-13.1-0.2-19.6-0.3c-13.1-0.2-26.2-0.1-39.3-0.2l-39.3-0.1 l-19.6,0l-4.9,0c-0.9,0-1.4,0-2-0.2c-0.6-0.2-1.2-0.4-1.7-0.8c-1-0.7-1.7-1.8-2-3.1c-0.1-0.3-0.1-0.6-0.1-0.9v-1.2v-0.9l69.4-0.2 l6.3,0v3.1c0,0.3,0.3,0.6,0.6,0.6h32.1c0.3,0,0.6-0.3,0.6-0.6v-3.3c4.5-0.1,9.1-0.1,13.6-0.3c5.9-0.1,11.8-0.3,17.7-0.6 c0.2,0,0.3-0.2,0.3-0.4c0-0.2-0.1-0.3-0.3-0.3c-5.9-0.2-11.8-0.4-17.7-0.6c-5.9-0.1-11.8-0.3-17.7-0.3c-11.8-0.1-23.7-0.2-35.5-0.2 l-71-0.2c-0.8,0-1.5,0.7-1.5,1.5c0,0,0,0,0,0l0,0v2.5v1.2c0,0.5,0.1,1,0.1,1.5c0.6,3,2.9,5.5,5.9,6.3c0.9,0.3,2.1,0.3,2.8,0.3l4.9,0 l19.6,0l39.3-0.1c13.1-0.1,26.2,0,39.3-0.2c6.5-0.1,13.1-0.1,19.6-0.3c6.5-0.1,13.1-0.3,19.6-0.6c0.2,0,0.3-0.2,0.3-0.4 C180.2,130,180.1,129.9,179.9,129.9L179.9,129.9z"/>
					<path fill="#BBCDDA" d="M201.6,0.3L201.6,0.3l-33.8-0.2l-33.8,0L66.6,0l-8.4,0c-0.7,0-1.4,0-2.2,0c-0.8,0-1.6,0.1-2.4,0.3 c-1.6,0.4-3,1.1-4.3,2.2c-2.5,2.1-4,5.3-4,8.5l0,8.4l0,33.8l0.1,65.3h2.8l0.1-65.3l0-33.8l0-8.4c0-3.7,2.5-7,6.1-7.9 c0.6-0.2,1.2-0.2,1.8-0.3c0.6,0,1.4,0,2.1,0l8.4,0l67.5-0.1l33.8,0l32.6-0.2l0.3,25.7l0.2,13.4l0.2,13.4c0,0.2,0.3,0.4,0.5,0.4 c0.2,0,0.3-0.2,0.4-0.4l0.2-13.4l0.2-13.4l0.3-26.9l0,0C202.8,0.8,202.3,0.3,201.6,0.3C201.6,0.3,201.6,0.3,201.6,0.3z"/>
					<path fill="#1397D5" d="M71.1,102.6c17.8-7.4,56.3-2.5,69,5.3l-69-0.2V102.6z"/>
				</svg>
				<p>
					{ __( 'Keeping your hard work safe is important, too. Jetpack Premium gives you brute force' +
						' login protection, automated spam filtering, and malware scanning. You also get daily backups ' +
						' with hassle-free restores, just in case you need them.'
					) }
				</p>
				<p>
					{ __( 'Start exploring Jetpack Premium now to see all the benefits of your new plan.'
					) }
				</p>
			</div>
		);
	}

	renderBelowContent() {
		return (
			<div>
				<Card
					href={ '#/writing' }
					compact
					className="jp-dialogue-card__below"
					onClick={ this.props.dismiss }
				>
					{ __( 'Enable premium video player' ) }
				</Card>
				<Card
					href={ '#/traffic' }
					compact
					className="jp-dialogue-card__below"
					onClick={ this.props.dismiss }
				>
					{ __( 'Monetize your site with ads' ) }
				</Card>
			</div>
		);
	}

	render() {
		return (
			<JetpackDialogue
				svg={ <img src={ imagePath + 'welcome-premium.svg' } width="250" alt={ __( 'People around page' ) } /> }
				title={ __( 'Your Premium Jetpack plan is powering up!' ) }
				content={ this.renderInnerContent() }
				belowContent={ this.renderBelowContent() }
				dismiss={ this.props.dismiss }
				className="jp-welcome-new-plan is-premium"
			/>
		);
	}
}

WelcomePremium.propTypes = {
	dismiss: React.PropTypes.func
};

export default WelcomePremium;
