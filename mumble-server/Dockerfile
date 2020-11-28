FROM alpine:3.12

ENV MM_VERSION 1.3.3
ENV MM_FILE murmur-static_x86-${MM_VERSION}.tar.bz2
ENV MM_URL https://github.com/mumble-voip/mumble/releases/download/${MM_VERSION}/${MM_FILE}

WORKDIR /etc/murmur

RUN set -xe \
    && apk add --no-cache curl tar \
    && curl -sSL ${MM_URL} | tar xj --strip 1 \
    && apk del curl tar

RUN apk update

RUN apk add --no-cache websockify --repository http://dl-cdn.alpinelinux.org/alpine/edge/testing

COPY run.sh /etc/murmur/run.sh
RUN chmod +x run.sh

CMD /etc/murmur/run.sh