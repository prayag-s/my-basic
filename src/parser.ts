// src/parser.ts

import { Token, TokenType } from "./token.js";
import {
    Statement, PrintStatement, GotoStatement, LetStatement,
    Expression, LiteralExpression, VariableExpression, BinaryExpression, GroupingExpression,
    RemStatement, ClsStatement
} from "./ast.js";

export class Parser {
    private tokens: Token[] = [];
    private current: number = 0;

    public parse(tokens: Token[]): Statement {
        this.tokens = tokens;
        this.current = 0;
        const statement = this.statement();

        // After parsing a statement, we must be at the end of the line.
        if (!this.isAtEnd()) {
            throw this.error(this.peek(), "SYNTAX ERROR");
        }

        return statement;
    }

    // --- Statement Parsers ---

    private statement(): Statement {
        if (this.check('PRINT')) return this.printStatement();
        if (this.check('GOTO')) return this.gotoStatement();
        if (this.check('LET')) return this.letStatement();
        if (this.check('REM')) return this.remStatement(); // <-- ADD
        if (this.check('CLS')) return this.clsStatement(); // <-- ADD

        // An implicit LET must start with an identifier.
        if (this.check('IDENTIFIER')) return this.implicitLetStatement();

        throw this.error(this.peek(), "SYNTAX ERROR");
    }
    
     private printStatement(): PrintStatement {
        this.consume('PRINT', "Internal Parser Error");
        const value = this.expression();
        // REMOVE THE EOF CHECK FROM HERE
        return { kind: "PrintStatement", value };
    }

    private gotoStatement(): GotoStatement {
        this.consume('GOTO', "Internal Parser Error");
        const target = this.consume('NUMBER', "SYNTAX ERROR");
        // REMOVE THE EOF CHECK FROM HERE
        return { kind: "GotoStatement", targetLine: target.literal };
    }

    private letStatement(): LetStatement { // <-- Return specific type
        this.consume('LET', "Internal Parser Error");
        return this.assignmentLogic();
    }

    private implicitLetStatement(): LetStatement { // <-- Return specific type
        return this.assignmentLogic();
    }
    
     private remStatement(): RemStatement {
        this.consume('REM', "Internal Parser Error");
        // A REM statement consumes the rest of the line as a raw string,
        // but it's not stored in a token. We need to look at the original source.
        // For now, we can just consume the EOF and store an empty comment.
        // A more advanced implementation would capture the text.
        let comment = "";
        // We'll just consume to the end of the line.
        while(!this.isAtEnd()) {
            comment += this.advance().lexeme + " ";
        }
        return { kind: "RemStatement", comment: comment.trim() };
    }

    // --- THIS IS THE CORRECTED FUNCTION ---
    private clsStatement(): ClsStatement {
        this.consume('CLS', "Internal Parser Error");
        // We do NOT consume the EOF token here. The main parse() method will check for it.
        return { kind: "ClsStatement" };
    }

    private assignmentLogic(): LetStatement {
        const nameToken = this.consume('IDENTIFIER', "SYNTAX ERROR");
        this.consume('EQUAL', "SYNTAX ERROR");
        const value = this.expression();
        // REMOVE THE EOF CHECK FROM HERE
        return { kind: "LetStatement", variable: { kind: "VariableExpression", name: nameToken.lexeme }, value };
    }

    // --- Expression Parser ---

    private expression(): Expression {
        return this.term(); // Start at the lowest precedence level
    }

    private term(): Expression {
        let expr = this.factor(); // Get the left-hand side

        // While we see a '+' or '-', we keep building up the expression
        while (this.match('PLUS', 'MINUS')) {
            const operator = this.previous();
            const right = this.factor(); // Get the right-hand side
            // Create a new binary expression, using the previous expression as the left side
            expr = { kind: "BinaryExpression", left: expr, operator, right } as BinaryExpression;
        }

        return expr;
    }

    private factor(): Expression {
        let expr = this.primary(); // Get the left-hand side

        // While we see a '*' or '/', do the same as term()
        while (this.match('STAR', 'SLASH')) {
            const operator = this.previous();
            const right = this.primary(); // Get the right-hand side
            expr = { kind: "BinaryExpression", left: expr, operator, right } as BinaryExpression;
        }

        return expr;
    }
    
    // primary() is now responsible for handling the most "atomic" parts
   private primary(): Expression {
        if (this.match('STRING', 'NUMBER')) {
            // Create the specific type first
            const literalExpr: LiteralExpression = {
                kind: "LiteralExpression",
                value: this.previous().literal
            };
            // Then return it. TypeScript knows a LiteralExpression is a valid Expression.
            return literalExpr;
        }
        if (this.match('IDENTIFIER')) {
            // Do the same here
            const varExpr: VariableExpression = {
                kind: "VariableExpression",
                name: this.previous().lexeme
            };
            return varExpr;
        }

         // --- ADD THIS LOGIC ---
        if (this.match('LEFT_PAREN')) {
            // Recursively call expression() to parse everything inside the parentheses.
            const expr = this.expression();
            // Then, we MUST find a closing parenthesis.
            this.consume('RIGHT_PAREN', "Expect ')' after expression.");
            
            const groupingExpr: GroupingExpression = {
                kind: "GroupingExpression",
                expression: expr
            };
            return groupingExpr;
        }
        // --- END ADDED LOGIC ---

        throw this.error(this.peek(), "SYNTAX ERROR");
    }
    
    // --- Helper Methods ---

    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) return this.advance();
        throw this.error(this.peek(), message);
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private isAtEnd(): boolean {
        // The last real token is the one BEFORE 'EOF'.
        return this.peek().type === 'EOF';
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private error(token: Token, message: string): Error {
        // Centralize error creation
        if (token.type === 'EOF') {
            console.error(`Error at end of line: ${message}`);
        } else {
            console.error(`Error at '${token.lexeme}': ${message}`);
        }
        return new Error(message);
    }
}