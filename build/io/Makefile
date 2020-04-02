OUT_PATH=/out/io
BITSTREAM_MODULE=${OUT_PATH}/bitstream.js
BITSTREAM_WORKER=${OUT_PATH}/bitstream-worker.js

BITSTREAM_DEF=bitstream-def.js

DISCLAIMER="// THIS IS A GENERATED FILE!  DO NOT EDIT, INSTEAD EDIT THE FILE IN bitjs/build/io."

all: ${BITSTREAM_MODULE} ${BITSTREAM_WORKER}

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

clean:
	rm -rf ${BITSTREAM_MODULE}
	rm -rf ${BITSTREAM_WORKER}
