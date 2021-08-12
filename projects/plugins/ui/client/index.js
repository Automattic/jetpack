import Currency from '@woocommerce/currency';
import { calculateDelta } from '@woocommerce/number';

const currency = Currency({});
const amount = currency.formatAmount(6821.3434);

console.log(amount);
console.log(calculateDelta(50, 100));
