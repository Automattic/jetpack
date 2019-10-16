# Jetpack Term of Service 

A Terms of Service Package that lets us know when a site has agreed to the terms of service.


### Usage

Site agrees to the terms of service.

```php
use Automattic\Jetpack\TermOfService;

$terms_of_service = new TermOfService();
$terms_of_service->agree();
```

Does the site have the terms of service?

```php
use Automattic\Jetpack\TermOfService;

$terms_of_service = new TermOfService();
$terms_of_service->has_agreed();
```
