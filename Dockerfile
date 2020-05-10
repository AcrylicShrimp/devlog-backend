FROM node:10

WORKDIR /srv/app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 8000
ENTRYPOINT npm run run:prd
