import { Spinner } from '@automattic/jetpack-components';
import React from 'react';

import './style.scss';

/**
 * Defines a centerized spinner
 *
 * @returns {React.Component} Loading component.
 */
export default function Loading() {
	return <Spinner className="jp-search-dashboard-page-loading-spinner" color="#000" size={ 32 } />;
}
