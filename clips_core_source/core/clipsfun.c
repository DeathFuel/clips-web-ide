#include "emscripten.h"
#include "clips.h"

#ifndef __EMSCRIPTEN__
#define EMSCRIPTEN_KEEPALIVE
#define EM_ASM(...)
#endif

EMSCRIPTEN_KEEPALIVE
void FlushOutput(Environment* env) {
    WriteString(env, STDOUT, "\n");
    EM_ASM (
	outputLog.value = outputLog.value.slice(0, -1);
    );
}

EMSCRIPTEN_KEEPALIVE
void PrintGreeting(Environment* env) {
    WriteString(env, STDOUT, CommandLineData(env)->BannerString);
    WriteString(env, STDOUT, COMMAND_PROMPT);
    FlushOutput(env);
}

EMSCRIPTEN_KEEPALIVE
void LoadAndExecute(Environment* env, const char* str) {
    int len = strlen(str);
    char c[2]; c[1] = 0;
    for (int i = 0; i <= len; i++) {
	if (i < len) {
	    c[0] = str[i];
	    WriteString(env, STDOUT, c);
	    ExpandCommandString(env,  str[i]);
	} else {
	    WriteString(env, STDOUT, "\n");
	    ExpandCommandString(env, '\n');
	}

	if (GetHaltExecution(env) == true) {
	    SetHaltExecution(env, false);
	    SetEvaluationError(env, false);
	    FlushCommandString(env);
	    WriteString(env, STDOUT, "\n");
	    PrintPrompt(env);
	}

	ExecuteIfCommandComplete(env);
    }
    FlushOutput(env);
}

