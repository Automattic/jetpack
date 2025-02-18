import { IntroOffer } from './types.js';

/**
 * Returns whether an Introductory Offer is a first month trial
 *
 * @param {IntroOffer} introOffer - an intro offer object
 * @return {boolean}               Whether it's a first month trial or not
 */
export function isFirstMonthTrial( introOffer: IntroOffer ): boolean {
	return introOffer?.interval_count === 1 && introOffer?.interval_unit === 'month';
}
