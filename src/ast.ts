// src/ast.ts

// The base interface for any executable statement (PRINT, GOTO, IF, etc.)
export interface Statement {
    // A 'kind' property helps us identify the statement type without using 'instanceof'
    kind: string;
}

// The base interface for any value-producing expression (2, "hello", A + 5)
export interface Expression {
    kind: string;
}

// --- Specific Statement Types ---

export interface PrintStatement extends Statement {
    kind: "PrintStatement";
    value: Expression; // The expression to be printed
}

export interface GotoStatement extends Statement {
    kind: "GotoStatement";
    targetLine: number;
}

// --- Specific Expression Types ---

// Represents a literal value, like 5 or "HELLO"
export interface LiteralExpression extends Expression {
    kind: "LiteralExpression";
    value: string | number;
}