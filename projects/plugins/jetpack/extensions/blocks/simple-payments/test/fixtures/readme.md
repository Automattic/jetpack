# Important Note

Due to inconsistancy in Intl.NumberFormat between node environments this method is mocked in `../validate.js` and will always return as `A${value}.00`, so any currencies in these fixtures need to be set to AUD and expect the result in this format.
