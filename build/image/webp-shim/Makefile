OUT_PATH=/out/image/webp-shim
OUT_NAME=webp-shim-module
OUT_TARGET=${OUT_PATH}/${OUT_NAME}.js

LIBWEBP_PATH=/libwebp/src
LIBWEBP_SRC=$(shell find ${LIBWEBP_PATH}/ -name '*.c')

SHIM_PATH=src
SHIM_SRC=${SHIM_PATH}/webp.c

debug: ${OUT_TARGET}
clean:
	rm -rf ${OUT_PATH}/${OUT_NAME}.*

# Debug:
# -O0
# Optimizations:
# -Os --llvm-lto 1
${OUT_TARGET}: ${SHIM_SRC} Makefile
	emcc -Os --llvm-lto 1 \
		-s WASM=1 \
		-s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap"]' \
		-s ALLOW_MEMORY_GROWTH=1 \
		-I /stb \
		-I /libwebp \
		${LIBWEBP_SRC} \
		${SHIM_SRC} \
		-o ${OUT_TARGET}
