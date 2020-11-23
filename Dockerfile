FROM node:14.15.1-alpine3.12

WORKDIR /home/node

COPY . .

RUN chown -R node: /home/node

USER node

RUN npm install && \
    npm rebuild node-sass

ENTRYPOINT npm run dev
