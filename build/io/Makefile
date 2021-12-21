OUT_PATH=../../io

BITSTREAM_MODULE=${OUT_PATH}/bitstream.js
BITSTREAM_WORKER=${OUT_PATH}/bitstream-worker.js

BYTESTREAM_MODULE=${OUT_PATH}/bytestream.js
BYTESTREAM_WORKER=${OUT_PATH}/bytestream-worker.js

BITBUFFER_MODULE=${OUT_PATH}/bitbuffer.js
BITBUFFER_WORKER=${OUT_PATH}/bitbuffer-worker.js

BYTEBUFFER_MODULE=${OUT_PATH}/bytebuffer.js
BYTEBUFFER_WORKER=${OUT_PATH}/bytebuffer-worker.js

BITSTREAM_DEF=bitstream-def.js
BYTESTREAM_DEF=bytestream-def.js
BITBUFFER_DEF=bitbuffer-def.js
BYTEBUFFER_DEF=bytebuffer-def.js

DISCLAIMER="// THIS IS A GENERATED FILE!  DO NOT EDIT, INSTEAD EDIT THE FILE IN bitjs/build/io."

all: ${BITSTREAM_MODULE} ${BITSTREAM_WORKER} \
	${BYTESTREAM_MODULE} ${BYTESTREAM_WORKER} \
	${BITBUFFER_MODULE} ${BITBUFFER_WORKER} \
	${BYTEBUFFER_MODULE} ${BYTEBUFFER_WORKER}

clean:
	rm -rf ${BITSTREAM_MODULE}
	rm -rf ${BITSTREAM_WORKER}
	rm -rf ${BYTESTREAM_MODULE}
	rm -rf ${BYTESTREAM_WORKER}
	rm -rf ${BITBUFFER_MODULE}
	rm -rf ${BITBUFFER_WORKER}
	rm -rf ${BYTEBUFFER_MODULE}
	rm -rf ${BYTEBUFFER_WORKER}

${BITSTREAM_MODULE}: Makefile ${BITSTREAM_DEF}
	echo ${DISCLAIMER} > ${BITSTREAM_MODULE}
	echo "export const BitStream =" >> ${BITSTREAM_MODULE}
	cat ${BITSTREAM_DEF} >> ${BITSTREAM_MODULE}

${BITSTREAM_WORKER}: Makefile ${BITSTREAM_DEF}
	echo ${DISCLAIMER} > ${BITSTREAM_WORKER}
	echo "var bitjs = bitjs || {};" >> ${BITSTREAM_WORKER}
	echo "bitjs.io = bitjs.io || {};" >> ${BITSTREAM_WORKER}
	echo "bitjs.io.BitStream =" >> ${BITSTREAM_WORKER}
	cat ${BITSTREAM_DEF} >> ${BITSTREAM_WORKER}

${BYTESTREAM_MODULE}: Makefile ${BYTESTREAM_DEF}
	echo ${DISCLAIMER} > ${BYTESTREAM_MODULE}
	echo "export const ByteStream =" >> ${BYTESTREAM_MODULE}
	cat ${BYTESTREAM_DEF} >> ${BYTESTREAM_MODULE}

${BYTESTREAM_WORKER}: Makefile ${BYTESTREAM_DEF}
	echo ${DISCLAIMER} > ${BYTESTREAM_WORKER}
	echo "var bitjs = bitjs || {};" >> ${BYTESTREAM_WORKER}
	echo "bitjs.io = bitjs.io || {};" >> ${BYTESTREAM_WORKER}
	echo "bitjs.io.ByteStream =" >> ${BYTESTREAM_WORKER}
	cat ${BYTESTREAM_DEF} >> ${BYTESTREAM_WORKER}

${BITBUFFER_MODULE}: Makefile ${BITBUFFER_DEF}
	echo ${DISCLAIMER} > ${BITBUFFER_MODULE}
	echo "export const BitBuffer =" >> ${BITBUFFER_MODULE}
	cat ${BITBUFFER_DEF} >> ${BITBUFFER_MODULE}

${BITBUFFER_WORKER}: Makefile ${BITBUFFER_DEF}
	echo ${DISCLAIMER} > ${BITBUFFER_WORKER}
	echo "var bitjs = bitjs || {};" >> ${BITBUFFER_WORKER}
	echo "bitjs.io = bitjs.io || {};" >> ${BITBUFFER_WORKER}
	echo "bitjs.io.BitBuffer =" >> ${BITBUFFER_WORKER}
	cat ${BITBUFFER_DEF} >> ${BITBUFFER_WORKER}

${BYTEBUFFER_MODULE}: Makefile ${BYTEBUFFER_DEF}
	echo ${DISCLAIMER} > ${BYTEBUFFER_MODULE}
	echo "export const ByteBuffer =" >> ${BYTEBUFFER_MODULE}
	cat ${BYTEBUFFER_DEF} >> ${BYTEBUFFER_MODULE}

${BYTEBUFFER_WORKER}: Makefile ${BYTEBUFFER_DEF}
	echo ${DISCLAIMER} > ${BYTEBUFFER_WORKER}
	echo "var bitjs = bitjs || {};" >> ${BYTEBUFFER_WORKER}
	echo "bitjs.io = bitjs.io || {};" >> ${BYTEBUFFER_WORKER}
	echo "bitjs.io.ByteBuffer =" >> ${BYTEBUFFER_WORKER}
	cat ${BYTEBUFFER_DEF} >> ${BYTEBUFFER_WORKER}
