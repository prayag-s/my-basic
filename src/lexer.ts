// src/lexer.ts

import { Token, TokenType } from "./token.js";

// A map to check if an identifier is a reserved keyword.
const keywords: Record<string, TokenType> = {
    "PRINT": "PRINT",
    "GOTO": "GOTO",
    "LET": "LET",
    "REM": "REM",       // <-- ADD
    "CLS": "CLS",       // <-- ADD
    "LIST": "LIST"
};

export class Lexer {
    private source: string = '';
    private tokens: Token[] = [];
    private start: number = 0;
    private current: number = 0;
    private line: number = 1;

    public scanTokens(source: string): Token[] {
        this.source = source;
        this.tokens = [];
        this.start = 0;
        this.current = 0;
        this.line = 1;

        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }

        // Add a final "End of File" token
        this.tokens.push({ type: 'EOF', lexeme: '', line: this.line });
        return this.tokens;
    }

    private scanToken(): void {
        const c = this.advance();
        switch (c) {
            // Single-character tokens (we'll add more later)
            case '(': this.addToken('LEFT_PAREN'); break;
            case ')': this.addToken('RIGHT_PAREN'); break;
            case '=': this.addToken('EQUAL'); break;
            case '+': this.addToken('PLUS'); break;
            case '-': this.addToken('MINUS'); break;
            case '*': this.addToken('STAR'); break;
            case '/': this.addToken('SLASH'); break;

            // Ignore whitespace
            case ' ':
            case '\r':
            case '\t':
                break;

            // String literals
            case '"': this.string(); break;

            default:
                if (this.isDigit(c)) {
                    this.number();
                } else if (this.isAlpha(c)) {
                    this.identifier();
                } else {
                    // For now, we don't handle errors gracefully, just log them
                    console.error(`[Line ${this.line}] Unexpected character: ${c}`);
                }
                break;
        }
    }

    private identifier(): void {
        while (this.isAlphaNumeric(this.peek())) this.advance();
        // --- ADD THIS BLOCK ---
        // After finding the main part of the identifier, check if it's
        // followed by a type-suffix character like '$'.
        if (this.peek() === '$') {
            this.advance(); // If so, consume it as part of the identifier.
        }
        // We can add other suffixes here later, like '%' or '!'.
        // --- END ADDED BLOCK ---
        const text = this.source.substring(this.start, this.current).toUpperCase();
        const type = keywords[text] || 'IDENTIFIER';
        this.addToken(type);
    }

    private number(): void {
        while (this.isDigit(this.peek())) this.advance();
        // Look for a fractional part
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            // Consume the "."
            this.advance();
            while (this.isDigit(this.peek())) this.advance();
        }
        const value = parseFloat(this.source.substring(this.start, this.current));
        this.addToken('NUMBER', value);
    }

    private string(): void {
        while (this.peek() !== '"' && !this.isAtEnd()) {
            if (this.peek() === '\n') this.line++;
            this.advance();
        }

        if (this.isAtEnd()) {
            console.error(`[Line ${this.line}] Unterminated string.`);
            return;
        }

        // The closing ".
        this.advance();

        // Trim the surrounding quotes.
        const value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken('STRING', value);
    }

    // --- Helper Methods ---

    private isDigit(c: string): boolean { return c >= '0' && c <= '9'; }
    private isAlpha(c: string): boolean { return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_'; }
    private isAlphaNumeric(c: string): boolean { return this.isAlpha(c) || this.isDigit(c); }

    private isAtEnd(): boolean { return this.current >= this.source.length; }
    private advance(): string { return this.source.charAt(this.current++); }
    private peek(): string { return this.isAtEnd() ? '\0' : this.source.charAt(this.current); }
    private peekNext(): string { return this.current + 1 >= this.source.length ? '\0' : this.source.charAt(this.current + 1); }

    private addToken(type: TokenType, literal?: any): void {
        const text = this.source.substring(this.start, this.current);
        this.tokens.push({ type, lexeme: text, literal, line: this.line });
    }
}