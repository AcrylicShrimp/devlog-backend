FROM node:10

WORKDIR /srv/app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

ENV TYPEORM_SYNCHRONIZE=false
ENV TYPEORM_LOGGING=true
ENV TYPEORM_DRIVER_EXTRA="{\"dateStrings\": true}"
ENV TYPEORM_ENTITIES=dist/db/entity/**/*.js
ENV TYPEORM_MIGRATIONS=dist/db/migration/**/*.js
ENV TYPEORM_SUBSCRIBERS=dist/db/subscriber/**/*.js
ENV TYPEORM_ENTITIES_DIR=dist/db/entity
ENV TYPEORM_MIGRATIONS_DIR=dist/db/migration
ENV TYPEORM_SUBSCRIBERS_DIR=dist/db/subscriber

EXPOSE 8000
ENTRYPOINT npm run run:prd
