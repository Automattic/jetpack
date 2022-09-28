/*
 * types
 */
import { paidFeaturesProp, usePlanProps } from './types';

const { paidFeatures = <paidFeaturesProp>{} } =
	window && window.jetpackVideoPressInitialState ? window.jetpackVideoPressInitialState : {};

export const usePlan = (): usePlanProps => {
	return {
		features: paidFeatures,
	};
};
