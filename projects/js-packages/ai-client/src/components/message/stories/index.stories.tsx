/**
 * External dependencies
 */
import { action } from '@storybook/addon-actions';
import React from 'react';
/**
 * Internal dependencies
 */
import Message, {
	GuidelineMessage,
	UpgradeMessage,
	ErrorMessage,
	MESSAGE_SEVERITY_WARNING,
	MESSAGE_SEVERITY_ERROR,
	MESSAGE_SEVERITY_SUCCESS,
	MESSAGE_SEVERITY_INFO,
} from '../index.js';

export default {
	title: 'JS Packages/AI Client/Message',
	component: Message,
	decorators: [
		Story => (
			<div style={ { backgroundColor: 'transparent' } }>
				<Story />
			</div>
		),
	],
};

const DefaultTemplate = args => {
	return <Message { ...args } />;
};

const DefaultArgs = {
	children: <span>Message</span>,
};

export const Default = DefaultTemplate.bind( {} );
Default.args = DefaultArgs;

const GuidelineTemplate = args => {
	return <GuidelineMessage { ...args } />;
};

const GuidelineArgs = {};

export const Guideline = GuidelineTemplate.bind( {} );
Guideline.args = GuidelineArgs;

const UpgradeTemplate = args => {
	return (
		<UpgradeMessage
			requestsRemaining={ args.requestsRemaining }
			severity={ args.severity }
			onUpgradeClick={ action( 'onUpgradeClick' ) }
		/>
	);
};

const UpgradeArgs = {
	requestsRemaining: 10,
	severity: null,
};

export const Upgrade = UpgradeTemplate.bind( {} );
Upgrade.args = UpgradeArgs;
Upgrade.argTypes = {
	severity: {
		control: {
			type: 'select',
		},
		options: [ 'Default', 'Info', 'Warning', 'Error', 'Success' ],
		mapping: {
			Default: null,
			Info: MESSAGE_SEVERITY_INFO,
			Warning: MESSAGE_SEVERITY_WARNING,
			Error: MESSAGE_SEVERITY_ERROR,
			Success: MESSAGE_SEVERITY_SUCCESS,
		},
	},
};

const ErrorTemplate = args => {
	return <ErrorMessage error={ args.error } onTryAgainClick={ action( 'onTryAgainClick' ) } />;
};

const ErrorArgs = {
	error: 'An error occurred',
};

export const Error = ErrorTemplate.bind( {} );
Error.args = ErrorArgs;
