FROM ubuntu:18.04

RUN apt-get update && apt-get install -y \
    cmake \
    git-core \
    python \
    wget

# Put more deps here ...
# RUN apt-get update && apt-get install -y \

RUN git clone https://github.com/webmproject/libwebp

RUN git clone https://github.com/emscripten-core/emsdk.git && \
    cd emsdk && \
    ./emsdk install latest && \
    ./emsdk activate latest

RUN git clone https://github.com/nothings/stb.git

# Figure out how to invoke emsdk/emsdk_env.sh and have it affect PATH.
ENV PATH="$PATH:/emsdk:/emsdk/node/12.9.1_64bit/bin:/emsdk/upstream/emscripten"

COPY . .
