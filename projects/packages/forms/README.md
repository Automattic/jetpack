# Jetpack Forms

All things forms. This package currently contains the implementation for Jetpack's Contact Form module, Form blocks, and the new Jetpack Forms feedback dashboard.

## Hierarchy

```
.
├── src/
│   ├── blocks/                                      - Form blocks.
│   ├── contact-form/                                - Contact form module implementation.
│   ├── dashboard/                                   - Implementation for the new forms dashboard.
│   ├── service/                                     - Helpers for 3rd-party service integrations.
│   ├── class-jetpack-forms.php                      - Package entrypoint.
│   └── class-wpcom-rest-api-v2-endpoint-forms.php   - WP.com REST API endpoints definition.
│
└── tools/                                           - Webpack configuration for all bundles in the package.
```

See the individual subdirectories for more information.

## API Endpoints

This package adds the following WP.com REST API endpoints:

### `GET /forms/responses`

Returns a list of contact form responses.

Supported params:

- `parent_id`: (int) Filter responses by parent post ID.
- `limit`: (int) Limit the number of returned responses.
- `month`: (string) Filter responses by month. Format: `YYYYMM`
- `offset`: (int) Offset the returned responses.
- `search`: (string) Search for responses where any field includes the given string.
- `status`: (string) Filter responses by status. Supported values: `inbox`, `spam`, `trash`.

Response:

```json
{
    "filters_available": {
        "month": [
            { "month": 1, "year": 2023 },
            { "month": 3, "year": 2023 },
        ],
        "source": [
            {
                "id": 55,
                "title": "Contact Page",
                "url": "https://jetpackme.wordpress.com/contact-support",
            }
        ],
    },
    "responses": [
        {
            "id": 123,
            "entry_permalink": "https://jetpackme.wordpress.com/contact-support",
            "entry_title": "Contact Page",
            "ip": "127.0.0.1",
            "date": "2023-01-05T00:00:00",
            "fields": {
                "1_Name": "John Smith",
                "2_Email": "john.smith@foo.bar",
                "3_Message": "Help!",
            },
        },
        {
            "id": 213,
            "entry_permalink": "https://jetpackme.wordpress.com/contact-support",
            "entry_title": "Contact Page",
            "ip": "127.0.0.1",
            "date": "2023-03-20T05:23:00",
            "fields": {
                "1_Name": "John Smith",
                "2_Email": "john.smith@foo.bar",
                "3_Message": "Lorem Ipsum",
            },
        },
    ],
    "totals": {
        "inbox": 2,
        "spam": 0,
        "trash": 1,
    },
}
```

### `POST /forms/responses/bulk_actions`

Performs bulk actions on a list of response IDs.

Supported params:

- `action`: (string) The action to perform. Supported values: `mark_as_spam`, `mark_as_not_spam`, `trash`, `untrash`, `delete` (permamently removes the response).
- `post_ids`: (int[]) The list of response IDs to perform the action on.

Response:

```json
{}
```

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

forms is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
