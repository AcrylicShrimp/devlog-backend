FROM node:14

WORKDIR /srv/app

ENV TYPEORM_SYNCHRONIZE=false TYPEORM_LOGGING=false TYPEORM_DRIVER_EXTRA="{\"dateStrings\": true}" TYPEORM_ENTITIES=dist/db/entity/**/*.js TYPEORM_MIGRATIONS=dist/db/migration/**/*.js  TYPEORM_SUBSCRIBERS=dist/db/subscriber/**/*.js TYPEORM_ENTITIES_DIR=dist/db/entity TYPEORM_MIGRATIONS_DIR=dist/db/migration TYPEORM_SUBSCRIBERS_DIR=dist/db/subscriber

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 8000
ENTRYPOINT npm run run:prd
