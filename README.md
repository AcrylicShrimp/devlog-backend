# devlog-backend

A minimal devlog service.

## Features

-   Markdown based posts
-   Supports image uploading to `AWS S3`
-   Supports thumbnails
-   Supports [blurhash](https://blurha.sh)
-   Supports [elasticsearch](https://www.elastic.co/)
-   Supports access level
-   Minimal administration APIs
-   Generates sitemaps automatically
-   SSR
-   CDN

## Environment variables

| Variable                          | Description                                                                                                                                                                          | Related functionality      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| `AWS_ACCESS_KEY_ID`               | AWS Access key ID                                                                                                                                                                    | Post images and thumbnails |
| `AWS_SECRET_ACCESS_KEY`           | AWS Secret key                                                                                                                                                                       | Post images and thumbnails |
| `AWS_REGION`                      | AWS region                                                                                                                                                                           | Post images and thumbnails |
| `AWS_S3_BUCKET_NAME`              | AWS S3 bucket name                                                                                                                                                                   | Post images and thumbnails |
| `AWS_S3_CACHE_CONTROL`            | AWS S3 cache control value (must be valid [Cache-Control value](https://developer.mozilla.org/ko/docs/Web/HTTP/Headers/Cache-Control) e.g. max-age=3600 defaults to 'max-age=86400') | Post images and thumbnails |
| `TYPEORM_CONNECTION`              | [Typeorm setting](https://github.com/typeorm/typeorm/blob/master/docs/using-ormconfig.md#using-environment-variables)                                                                | Database                   |
| `TYPEORM_HOST`                    | [Typeorm setting](https://github.com/typeorm/typeorm/blob/master/docs/using-ormconfig.md#using-environment-variables)                                                                | Database                   |
| `TYPEORM_PORT`                    | [Typeorm setting](https://github.com/typeorm/typeorm/blob/master/docs/using-ormconfig.md#using-environment-variables)                                                                | Database                   |
| `TYPEORM_USERNAME`                | [Typeorm setting](https://github.com/typeorm/typeorm/blob/master/docs/using-ormconfig.md#using-environment-variables)                                                                | Database                   |
| `TYPEORM_PASSWORD`                | [Typeorm setting](https://github.com/typeorm/typeorm/blob/master/docs/using-ormconfig.md#using-environment-variables)                                                                | Database                   |
| `TYPEORM_DATABASE`                | [Typeorm setting](https://github.com/typeorm/typeorm/blob/master/docs/using-ormconfig.md#using-environment-variables)                                                                | Database                   |
| `ELASTICSEARCH_NODE_HOST`         | Hostname of the elasticsearch node (maybe `127.0.0.1`)                                                                                                                               | Elasticsearch              |
| `ELASTICSEARCH_NODE_PORT`         | Port number of the elasticsearch node (maybe `9200`)                                                                                                                                 | Elasticsearch              |
| `SITEMAP_BASE_URL`                | URL of the frontend index page for sitemaps (must be end with a slash e.g. `https://blog.ashrimp.dev/`)                                                                              | Sitemap                    |
| `POST_BASE_URL`                   | URL of the frontend post page for sitemaps (must be end with a slash e.g. `https://blog.ashrimp.dev/posts/`)                                                                         | Sitemap                    |
| `SSR_FRONTEND_URL`                | URL of the frontend post page for SSR (must be end with a slash e.g. `https://blog.ashrimp.dev/`)                                                                                    | SSR                        |
| `SSR_FRONTEND_DIR`                | Path to the frontend directory                                                                                                                                                       | SSR                        |
| `SSR_FRONTEND_SCRIPTS`            | Comma-separated list of script file names that must be executed during SSR                                                                                                           | SSR                        |
| `SSR_FRONTEND_SCRIPT_ATTACHMENTS` | Comma-separated list of script URLs that must be attached to the end of body after SSR (e.g. `/index.js`)                                                                            | SSR                        |
| `SSR_FRONTEND_EVENT`              | DOM event name that will be fired when the pages are ready to serve for SSR (defaults to `app-loaded`)                                                                               | SSR                        |
| `SSR_FRONTEND_TIMEOUT`            | Timeout of the SSR rendering in milisecond (defaults to `5000`)                                                                                                                      | SSR                        |
| `SSR_CACHE_EXPIRY`                | Expiry of the caches for SSR rendered pages in milisecond (defaults to `604800000`, the caches are automatically purged when any visible changes made)                               | SSR                        |
| `CDN_BASE_URL`                    | URL of the CDN to serve images(**NOT** videos) (must be end with a slash e.g. `https://cdn.blog.ashrimp.dev/`)                                                                       | CDN                        |

## Access Level

`devlog-backend` supports access level control of each post.

-   `public`: Posts can be listed and fetched by anonymous clients.
-   `unlisted`: Posts cannot be listed, but **can** be fetched by anonymous clients.
-   `private`: Posts can be listed and fetched by only authenticated clients.
