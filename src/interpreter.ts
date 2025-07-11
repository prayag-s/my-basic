// src/interpreter.ts

import {
    Statement,
    Expression,
    PrintStatement,
    GotoStatement,
    LetStatement,         // Ensure this is imported
    LiteralExpression,
    VariableExpression,    // Ensure this is imported
    BinaryExpression,
    GroupingExpression,
    RemStatement, ClsStatement,
    InputStatement
} from "./ast.js";
import { Parser } from "./parser.js";
import { Lexer } from "./lexer.js";
import { Environment } from "./environment.js";

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
    
    private lexer: Lexer; 
    private parser: Parser;
    private environment: Environment;

    // --- ADD NEW PROPERTIES ---
    private isAwaitingInput: boolean = false;
    // This is a "resolver" function for a promise we'll create.
    private inputResolver: ((value: string) => void) | null = null;

    constructor(private outputElement: HTMLElement,  private commandElement: HTMLElement) {
        this.lexer = new Lexer(); 
        this.parser = new Parser();
        this.environment = new Environment();
    }

    public handleUserInput(text: string): void {
        if (this.isAwaitingInput && this.inputResolver) {
            // If we are waiting for input, resolve the promise.
            this.submitInput(text);
        } else {
            // Otherwise, treat it as a new immediate command.
            this.log(`>${text}`);
            this.executeImmediate(text.trim());
        }
    }

     // This is the public-facing method our App will call
    private submitInput(text: string): void {
        if (!this.isAwaitingInput || !this.inputResolver) return;
        
        this.inputResolver(text); // Resolve the promise with the user's text
        
        // Clean up
        this.isAwaitingInput = false;
        this.inputResolver = null;
        this.commandElement.textContent = '';
        this.commandElement.blur(); // Un-focus the input element
    }

   public log(message: string, sameLine: boolean = false): void {
    if (sameLine && this.currentLineElement) {
        this.currentLineElement.innerHTML += message.replace(/ /g, ' ');
    } else {
        this.currentLineElement = document.createElement('p');
        this.currentLineElement.innerHTML = message.replace(/ /g, ' ');
        this.outputElement.appendChild(this.currentLineElement);
    }
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
            // No "Ready" prompt after entering a line, just like the original.
            return; 
        }

        // --- ADD THE LOGIC FOR IMMEDIATE COMMANDS HERE ---
        const command = code.trim().toUpperCase();
        switch (command) {
            case "RUN":
                this.run();
                break; // run() handles its own "Ready" prompt

            case "LIST":
                this.listProgram(); // Call a new helper method
                this.log("Ready");
                break;
            case "CLS": this.clearScreen(); this.log("Ready"); break; // <-- ADD immediate CLS
            case "NEW": this.newProgram(); this.log("Ready"); break;
            default:
                this.log("?SYNTAX ERROR");
                this.log("Ready");
                break;
        }
    }
    
    // This private method returns a promise that resolves when the user types.
    private waitForInput(): Promise<string> {
        return new Promise((resolve) => {
            this.isAwaitingInput = true;
            this.inputResolver = resolve;
            this.commandElement.focus(); // Focus the input element
        });
    }

    private listProgram(): void {
        // Get all line numbers, sort them numerically, and print each one.
        const sortedLines = Array.from(this.program.keys()).sort((a, b) => a - b);
        for (const lineNumber of sortedLines) {
            const code = this.program.get(lineNumber);
            this.log(`${lineNumber} ${code}`);
        }
    }

    // The RUN command is now async to allow for non-blocking execution
     public async run(): Promise<void> {
        if (this.isRunning) return;

        // Clear state for the new run
        this.environment.clear();
        this.parsedProgram.clear();
        
         // --- PARSE PHASE (This is now the Lexer -> Parser pipeline) ---
        this.parsedProgram.clear();
        const sortedLines = Array.from(this.program.keys()).sort((a, b) => a - b);
        let hasParsingFailed = false;

        for (const lineNumber of sortedLines) {
            try {
                const code = this.program.get(lineNumber)!;
                // 1. Lexical Analysis (Scanning)
                const tokens = this.lexer.scanTokens(code);
                // 2. Syntactic Analysis (Parsing)
                const statement = this.parser.parse(tokens);
                this.parsedProgram.set(lineNumber, statement);
            } catch (e) {
                this.log(`?${(e as Error).message.toUpperCase()} IN ${lineNumber}`);
                this.log("Ready");
                hasParsingFailed = true;
                break;
            }
        }
        
        if (hasParsingFailed) return;
        
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
                        throw new Error("UNDEFINED LINE NUMBER");
                    }
                    i = newIndex;
                } else {
                    i++;
                }
            } catch (e) {
                this.log(`?${(e as Error).message.toUpperCase()} IN ${currentLineNumber}`);
                this.stopExecutionFlag = true;
            }

            await tick();
        }
        
        this.isRunning = false;
        this.log("Ready");
    }

    // --- Private Execution Helpers ---

     private clearScreen(): void {
        this.outputElement.innerHTML = '';
    }

    private newProgram(): void {
        this.program.clear();
        this.parsedProgram.clear();
        this.environment.clear();
    }

    private currentLineElement: HTMLParagraphElement | null = null;

    private async executeStatement(statement: Statement): Promise<number | null> {
        switch (statement.kind) {
            case "InputStatement":
                const inputStmt = statement as InputStatement;
                let promptText = "? ";
                if (inputStmt.prompt) {
                    promptText = String(this.evaluateExpression(inputStmt.prompt)) + " ";
                }
                
                this.log(promptText, true);
                
                const userInput = await this.waitForInput();
                
                // And give this a unique name, e.g., inputVarName
                const inputVarName = inputStmt.variable.name;
                let valueToStore: string | number = userInput;

                if (!inputVarName.endsWith('$')) {
                    valueToStore = parseFloat(userInput) || 0;
                }
                
                this.environment.set(inputVarName, valueToStore);
                return null;
            case "PrintStatement":
                const value = this.evaluateExpression((statement as PrintStatement).value);
                this.log(String(value));
                return null;

            case "GotoStatement":
                return (statement as GotoStatement).targetLine;

             case "LetStatement": // <-- ADD THIS CASE
                const letStmt = statement as LetStatement;
                const varName = letStmt.variable.name;
                const valueToAssign = this.evaluateExpression(letStmt.value);
                this.environment.set(varName, valueToAssign);
                return null;

            // A REM statement does absolutely nothing. We just ignore it.
            case "RemStatement":
                return null;

            case "ClsStatement":
                this.clearScreen();
                return null;
        }
        return null;
    }

     private evaluateExpression(expression: Expression): string | number {
        switch (expression.kind) {
            case "LiteralExpression":
                return (expression as LiteralExpression).value;
            
            case "VariableExpression":
                const varName = (expression as VariableExpression).name;
                return this.environment.get(varName);
            
                // --- ADD THIS NEW CASE ---
            case "BinaryExpression":
                const binExpr = expression as BinaryExpression;
                // Recursively evaluate the left and right sides
                const left = this.evaluateExpression(binExpr.left);
                const right = this.evaluateExpression(binExpr.right);

                // Ensure both are numbers for math operations
                if (typeof left !== 'number' || typeof right !== 'number') {
                    // In BASIC, this would be a "Type mismatch" error
                    throw new Error("TYPE MISMATCH");
                }

                // Perform the operation
                switch (binExpr.operator.type) {
                    case 'PLUS': return left + right;
                    case 'MINUS': return left - right;
                    case 'STAR': return left * right;
                    case 'SLASH': return left / right;
                }

            case "GroupingExpression":
                // The value of a grouping is just the value of the expression it contains.
                // We just evaluate the inner part and return it up.
                return this.evaluateExpression((expression as GroupingExpression).expression);

            // This default case fixes the "lacks ending return" error.
            default:
                throw new Error("INTERNAL ERROR: Unknown expression type");
        }
    }
}