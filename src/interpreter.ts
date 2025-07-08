// src/interpreter.ts

import { Statement, Expression, PrintStatement, GotoStatement, LiteralExpression } from "./ast.js";
import { Parser } from "./parser.js";

// A helper to pause execution and let the browser render.
function tick(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
}

export class Interpreter {
    private virtualRam: Uint8Array = new Uint8Array(65536);
    private program: Map<number, string> = new Map();
    private parsedProgram: Map<number, Statement> = new Map();

    private isRunning: boolean = false;
    private stopExecutionFlag: boolean = false;
    
    private parser: Parser;

    constructor(private outputElement: HTMLElement) {
        this.parser = new Parser();
    }

    public log(message: string): void {
        const p = document.createElement('p');
        p.innerHTML = String(message).replace(/ /g, ' ');
        this.outputElement.appendChild(p);
        this.outputElement.parentElement!.scrollTop = this.outputElement.scrollHeight;
    }

    public executeImmediate(code: string): void {
        const lineMatch = code.match(/^(\d+)\s*(.*)/);
        if (lineMatch) {
            const lineNumber = parseInt(lineMatch[1], 10);
            const lineCode = lineMatch[2];
            if (lineCode) {
                this.program.set(lineNumber, lineCode);
            } else {
                this.program.delete(lineNumber);
            }
        } else if (code.trim().toUpperCase() === "RUN") {
            this.run();
        } else {
            // We'll add more immediate commands like LIST later
            this.log("?SYNTAX ERROR");
            this.log("Ready");
        }
    }
    
    // The RUN command is now async to allow for non-blocking execution
    public async run(): Promise<void> {
        if (this.isRunning) return;

        // --- PARSE PHASE ---
        this.parsedProgram.clear();
        const sortedLines = Array.from(this.program.keys()).sort((a, b) => a - b);
        
        try {
            for (const lineNumber of sortedLines) {
                const code = this.program.get(lineNumber)!;
                this.parsedProgram.set(lineNumber, this.parser.parseLine(code));
            }
        } catch (e) {
            this.log(`?${(e as Error).message.toUpperCase()}`);
            this.log("Ready");
            return;
        }
        
        // --- EXECUTION PHASE ---
        this.isRunning = true;
        this.stopExecutionFlag = false;
        
        let i = 0; // Program counter index for sortedLines
        while (i < sortedLines.length && !this.stopExecutionFlag) {
            const currentLineNumber = sortedLines[i];
            const statement = this.parsedProgram.get(currentLineNumber)!;
            
            try {
                const jumpTo = await this.executeStatement(statement);
                
                if (jumpTo !== null) {
                    const newIndex = sortedLines.indexOf(jumpTo);
                    if (newIndex === -1) {
                        throw new Error("Undefined line number in GOTO");
                    }
                    i = newIndex; // Jump to the new line
                } else {
                    i++; // Go to the next line
                }

            } catch (e) {
                this.log(`?${(e as Error).message.toUpperCase()} IN ${currentLineNumber}`);
                this.stopExecutionFlag = true;
            }

            await tick(); // Let the browser breathe
        }
        
        this.isRunning = false;
        // We'll add the "Break in XXX" message later when we re-implement Ctrl+C
        this.log("Ready");
    }

    // --- Private Execution Helpers ---

    private async executeStatement(statement: Statement): Promise<number | null> {
        switch (statement.kind) {
            case "PrintStatement":
                const value = this.evaluateExpression((statement as PrintStatement).value);
                this.log(String(value));
                return null;

            case "GotoStatement":
                return (statement as GotoStatement).targetLine;
        }
        return null;
    }

    private evaluateExpression(expression: Expression): string | number {
        switch (expression.kind) {
            case "LiteralExpression":
                return (expression as LiteralExpression).value;
        }
    }
}