# My-BASIC: A GW-BASIC Interpreter in TypeScript

My-BASIC is a web-based re-implementation of the classic GW-BASIC programming environment from the 1980s. Written entirely in TypeScript and running in the browser, it aims to be a faithful and educational homage to the tool that introduced a generation to programming.

The ultimate goal of this project is to achieve a high degree of compatibility, allowing original `.BAS` files from the era to be loaded and run without modification.

## Core Principles

*   **Authenticity:** To replicate the behavior, command set, and quirks of the original GW-BASIC.
*   **Compatibility:** To run valid GW-BASIC programs from the 80s.
*   **Self-Containment:** To operate within a sandboxed "virtual machine" in the browser, including a virtual 64KB RAM and a virtual file system.
*   **Education:** To serve as a fun, practical example of how interpreters and parsers are built using modern web technologies.

## Current Status & Features

This project is currently under active development. The core interpreter architecture is in place.

### Implemented Commands:
*   `PRINT "string"`: Prints a string literal.
*   `PRINT variable`: Prints the value of a numeric or string variable.
*   `LET var = value`: Assigns a value (numeric or string) to a variable.
*   `GOTO line`: Transfers program execution to the specified line number.
*   `RUN`: Executes the program currently in memory.

### Architectural Features:
*   TypeScript-based for type safety and scalability.
*   Parser that builds an Abstract Syntax Tree (AST) from source code.
*   Asynchronous, non-blocking execution engine to prevent browser freeze.
*   A foundation for a 64KB virtual RAM space.

## How to Run

This project requires Node.js and npm to be installed.

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd my-basic-project
    ```

2.  **Install dependencies:**
    This will download the TypeScript compiler.
    ```bash
    npm install
    ```

3.  **Compile the TypeScript code:**
    This compiles the source code from `/src` into JavaScript in the `/dist` folder.
    ```bash
    npx tsc
    ```

4.  **Start the local development server:**
    This will serve the project on a local HTTP server and automatically open it in your browser.
    ```bash
    npx live-server
    ```
    *(If you don't have live-server, install it globally with `npm install -g live-server`)*

## Development Workflow

For active development, it's recommended to run the compiler and the server in "watch mode" in two separate terminals.

*   **Terminal 1 (Compiler):**
    ```bash
    npx tsc --watch
    ```

*   **Terminal 2 (Server):**
    ```bash
    npx live-server
    ```

Now, any changes you save to the `.ts` files in the `/src` directory will trigger an automatic re-compile, and `live-server` will automatically refresh your browser.