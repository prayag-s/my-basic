// src/parser.ts

import { Token, TokenType } from "./token.js";
import {
    Statement, PrintStatement, GotoStatement, LetStatement,
    Expression, LiteralExpression, VariableExpression, BinaryExpression, GroupingExpression
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

        // An implicit LET must start with an identifier.
        if (this.check('IDENTIFIER')) return this.implicitLetStatement();

        throw this.error(this.peek(), "SYNTAX ERROR");
    }
    
    private printStatement(): PrintStatement { // <-- Return specific type
        this.consume('PRINT', "Internal Parser Error");
        const value = this.expression();
        return { kind: "PrintStatement", value };
    }

    private gotoStatement(): GotoStatement { // <-- Return specific type
        this.consume('GOTO', "Internal Parser Error");
        const target = this.consume('NUMBER', "SYNTAX ERROR");
        return { kind: "GotoStatement", targetLine: target.literal };
    }

    private letStatement(): LetStatement { // <-- Return specific type
        this.consume('LET', "Internal Parser Error");
        return this.assignmentLogic();
    }

    private implicitLetStatement(): LetStatement { // <-- Return specific type
        return this.assignmentLogic();
    }
    
    private assignmentLogic(): LetStatement { // <-- Return specific type
        const nameToken = this.consume('IDENTIFIER', "SYNTAX ERROR");
        this.consume('EQUAL', "SYNTAX ERROR");
        const value = this.expression();

        const variable: VariableExpression = {
            kind: "VariableExpression",
            name: nameToken.lexeme
        };

        return { kind: "LetStatement", variable, value };
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