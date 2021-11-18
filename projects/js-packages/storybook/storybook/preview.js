/**
 * External dependencies
 */
import { addDecorator } from '@storybook/react';
import { withA11y } from '@storybook/addon-a11y';

/**
 * WordPress dependencies
 */
/* eslint-disable no-restricted-syntax */
// import '@wordpress/components/build-style/style.css';
/* eslint-enable no-restricted-syntax */

/**
 * Internal dependencies
 */
import './style.scss';

addDecorator( withA11y );
