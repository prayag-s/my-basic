// src/ast.ts
import { Token } from "./token.js"

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

// Represents reading a variable's value, e.g., the 'A' in 'PRINT A'
export interface VariableExpression extends Expression {
    kind: "VariableExpression";
    name: string; // The name of the variable, e.g., "A" or "B$"
}

// Represents an assignment statement, e.g., 'LET A = 10'
export interface LetStatement extends Statement {
    kind: "LetStatement";
    variable: VariableExpression; // The variable to assign to
    value: Expression;            // The expression providing the value
}


// Represents an operation with a left and right side, e.g., A + 5
export interface BinaryExpression extends Expression {
    kind: "BinaryExpression";
    left: Expression;
    operator: Token; // The token for the operator, e.g., PLUS, MINUS
    right: Expression;
}

export interface GroupingExpression extends Expression {
    kind: "GroupingExpression";
    expression: Expression; // The expression inside the parentheses
}