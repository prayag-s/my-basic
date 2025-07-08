// src/parser.ts

import {
    Statement,
    PrintStatement,
    GotoStatement,
    LiteralExpression
} from "./ast.js";

export class Parser {
    public parseLine(code: string): Statement {
        code = code.trim();
        const parts = code.split(/\s+(.*)/s);
        const command = parts[0].toUpperCase();
        const args = parts[1] || '';

        switch (command) {
            case 'PRINT':
                return this.parsePrintStatement(args);
            case 'GOTO':
                return this.parseGotoStatement(args);
            
            // If the command is unknown, we'll throw an error.
            default:
                throw new Error("Syntax error: Unknown command");
        }
    }

    private parsePrintStatement(args: string): PrintStatement {
        // For now, our PRINT only supports a single string literal.
        // We'll make this much smarter later.
        const stringLiteralMatch = args.match(/^"(.*)"$/);
        if (stringLiteralMatch) {
            const value = stringLiteralMatch[1]; // The content inside the quotes
            const literalExpression: LiteralExpression = {
                kind: "LiteralExpression",
                value: value
            };
            const printStatement: PrintStatement = {
                kind: "PrintStatement",
                value: literalExpression
            };
            return printStatement;
        }
        
        // If it's not a valid string literal, it's an error for now.
        throw new Error("Syntax error: PRINT expects a string literal");
    }

    private parseGotoStatement(args: string): GotoStatement {
        const targetLine = parseInt(args, 10);
        if (isNaN(targetLine)) {
            throw new Error("Syntax error: GOTO expects a line number");
        }

        const gotoStatement: GotoStatement = {
            kind: "GotoStatement",
            targetLine: targetLine
        };
        return gotoStatement;
    }
}