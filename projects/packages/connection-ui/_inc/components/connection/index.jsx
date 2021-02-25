/**
 * External dependencies
 */
import React from 'react';
import JetpackConnection from '@automattic/jetpack-connection';

const Connection = () => {
	return <JetpackConnection connectUrl="https://wordpress.com" label="Connect" />;
};

export default Connection;
