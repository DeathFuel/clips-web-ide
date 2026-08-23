WEB_SRC := ../../src
CLP_SRC := .
OUT_DIR := $(CLP_SRC)/out
TARGET  := clips

FLAGS 	:= -O3 -fno-strict-aliasing
LDLIBS	:= -lm
WARNS 	:= -Wall -Wundef -Wpointer-arith -Wshadow -Wstrict-aliasing -Winline -Wredundant-decls -Waggregate-return
EMFLAGS	:= -Os \
		   -s EXPORTED_FUNCTIONS=_CreateEnvironment,_DestroyEnvironment,_free \
		   -s EXPORTED_RUNTIME_METHODS=ccall,cwrap,UTF8ToString,getValue \
		   -s ALLOW_MEMORY_GROWTH -s MODULARIZE -s EXPORT_ES6 -s EXPORT_NAME="makeModule" \
		   --emit-tsd $(WEB_SRC)/emcc-tsd.d.ts \
		   -s EMULATE_FUNCTION_POINTER_CASTS # fixes defmodule issues

SOURCES := $(filter-out $(CLP_SRC)/main.c, $(shell find $(CLP_SRC) -type f -name '*.c'))
OBJS    := $(patsubst $(CLP_SRC)/%.c,$(OUT_DIR)/%.o,$(SOURCES))

.PHONY: all clean prepare $(TARGET)

all: $(TARGET)

$(TARGET): $(OBJS)
	emcc -o $@.js $^ $(EMFLAGS) $(LDLIBS)
	mv -f $@.js $(WEB_SRC)/
	mv -f $@.wasm $(WEB_SRC)/

$(OUT_DIR)/%.o: $(CLP_SRC)/%.c
	mkdir -p $(@D) && emcc $(FLAGS) $(WARNS) -c $< -o $@

clean:
	rm -f $(TARGET).js $(TARGET).wasm $(WEB_SRC)/$(TARGET).js $(WEB_SRC)/$(TARGET).wasm $(OBJS)
	rmdir $(OUT_DIR)
