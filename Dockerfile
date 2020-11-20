FROM node:14.15.1-alpine3.12

RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    mkdir -p /home/appuser/.npm-global && \
    npm config set prefix '~/.npm-global'

ENV PATH=/home/appuser/.npm-global/bin:$PATH

USER appuser

COPY . .

RUN npm install

ENTRYPOINT npm run dev
