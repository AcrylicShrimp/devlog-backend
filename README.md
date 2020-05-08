# devlog-backend

A minimal devlog service.

## Features

-   Markdown based posts
-   Supports image uploading to `AWS S3`
-   Supports [blurhash](https://blurha.sh)
-   Supports access level
-   Minimal administration API

### Access Level

`devlog-backend` supports access level control of each post.

-   `public`: Posts can be listed and fetched by anonymous clients.
-   `unlisted`: Posts cannot be listed, but **can** be fetched by anonymous clients.
-   `private`: Posts can be listed and fetched by only authenticated clients.
