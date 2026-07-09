WEB_SRC := ../../src
CLP_SRC := .
OUT_DIR := $(CLP_SRC)/out
TARGET  := clips

FLAGS 	:= -O3 -fno-strict-aliasing
LDLIBS	:= -lm
WARNS 	:= -Wall -Wundef -Wpointer-arith -Wshadow -Wstrict-aliasing -Winline -Wredundant-decls -Waggregate-return
EMFLAGS	:= -s EXPORTED_FUNCTIONS=_CreateEnvironment,_DestroyEnvironment \
	   -s EXPORTED_RUNTIME_METHODS='["ccall"]' \
	   -s ALLOW_MEMORY_GROWTH -s MODULARIZE -s EXPORT_ES6 -s EXPORT_NAME="makeModule" \
	   --pre-js $(WEB_SRC)/emcc-pre.js

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
	rm -f $(TARGET).js $(TARGET).wasm $(OBJS)
	rmdir $(OUT_DIR)
