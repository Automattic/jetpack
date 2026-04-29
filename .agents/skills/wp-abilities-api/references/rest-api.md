# REST API quick guide (`wp-abilities/v1`)

The Abilities API exposes endpoints under the REST namespace:

- `wp-abilities/v1/abilities`
- `wp-abilities/v1/categories`

Debug checklist:

- Confirm the route exists under `wp-json/wp-abilities/v1/...`.
- Verify the ability/category shows in REST responses.
- If missing, confirm `meta.show_in_rest` is enabled for that ability.

