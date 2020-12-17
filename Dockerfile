FROM node:14

WORKDIR /srv/app

ENV TYPEORM_SYNCHRONIZE=false
ENV TYPEORM_LOGGING=false
ENV TYPEORM_DRIVER_EXTRA="{\"dateStrings\": true}"
ENV TYPEORM_ENTITIES=dist/db/entity/**/*.js
ENV TYPEORM_MIGRATIONS=dist/db/migration/**/*.js
ENV TYPEORM_SUBSCRIBERS=dist/db/subscriber/**/*.js
ENV TYPEORM_ENTITIES_DIR=dist/db/entity
ENV TYPEORM_MIGRATIONS_DIR=dist/db/migration
ENV TYPEORM_SUBSCRIBERS_DIR=dist/db/subscriber

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 8000
ENTRYPOINT npm run run:prd
