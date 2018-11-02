# Get Details About Your Individual Activations

This endpoint will list out individual activations in a paged method.

### Endpoint Information

- __Method__: GET
- __URL__:    `https://public-api.wordpress.com/wpcom/v2/jetpack-partners/PARTNER_ID/key/KEY_ID/activations`

### Request Parameters

- __page__: Optional. Page number to return.
- __per_page__: Optional. Sites per page. Defaults to 20.
- __plans__: Optional. Array of plans to filter down to.
- __activated_after__: Optional. Only return sites activated after this datetime.
- __activated_before__: Optional. Only return sites activated before this datetime.

### Response Properties

- __total__: Total number of results.
- __activations__: Array of site objects.

#### Site Object Properties

- __id__: Site ID.
- __jetpack_partner_key_id__: Your partner ID.
- __wpcom_blog_id__: The ID of the WP.com shadow copy site.
- __wpcom_user_id__: The owner's WP.com user ID.
- __external_user_id__: ?
- __product_id__: The ID of the Jetpack product that the site has.
- __created_on__: Datetime of the site's creation.
- __activated_on__: Datetime of the site's activation.
- __cancelled_on__: Datetime of the site's cancellation. Probably `null`.
- __disputed_on__: Probably `null`.
- __site_registered__: Datetime.
- __site_url__: The site's URL.
- __site_name__: The site's name.
- __site_icon__: The site's icon. Can be `null`.
- __current_product_id__: Always same as `product_id`