# Get A Summary Of Your Activations

This is the endpoint used to make the graph in the Jetpack Partner Portal.

### Endpoint Information

- __Method__: GET
- __URL__:    `https://public-api.wordpress.com/wpcom/v2/jetpack-partners/activations`

### Request Parameters

- __key_id__: Your key ID, as pulled from the portal.
- __scale__: `day`, `month`, or `year`. Defaults to `month`.

### Response Properties

An array of the following objects:

- __date__: The time period that the data is for.
- __new__: The number of new activations in this time period.
- __total__: The total number of activations as of this time period.