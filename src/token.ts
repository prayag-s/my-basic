// src/token.ts

// Defines all the possible types a token can be.
export type TokenType =
    // Literals
    | 'STRING' | 'NUMBER'

    // Keywords
    | 'PRINT' | 'GOTO' | 'LET'

    // Identifiers (variable names)
    | 'IDENTIFIER'

    // Operators
    | 'EQUAL' | 'PLUS' | 'MINUS' | 'STAR' | 'SLASH'

    | 'LEFT_PAREN' | 'RIGHT_PAREN'

    // End of File/Line
    | 'EOF';

// The Token object itself.
export interface Token {
    type: TokenType;
    lexeme: string;  // The raw text of the token, e.g., "PRINT" or "123"
    literal?: any;   // The actual value, e.g., the number 123
    line: number;    // The line number it appeared on (for future error reporting)
}