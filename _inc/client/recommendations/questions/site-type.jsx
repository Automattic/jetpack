/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { QuestionLayout } from './layout';

const SiteTypeQuestionComponent = () => {
	return <QuestionLayout />;
};

export const SiteTypeQuestion = connect(
	state => ( {} ),
	dispatch => ( {} )
)( SiteTypeQuestionComponent );
