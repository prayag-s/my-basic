// src/main.ts

import { Interpreter } from "./interpreter.js";

class App {
    private interpreter!: Interpreter;

    constructor() {
        // Find the necessary HTML elements
        const outputElement = document.getElementById('output') as HTMLElement;
        const commandElement = document.getElementById('command') as HTMLElement;
        const inputLineElement = document.getElementById('input-line') as HTMLElement;

        if (!outputElement || !commandElement || !inputLineElement) {
            // Throwing an error is better for fatal conditions
            throw new Error("Fatal Error: A required HTML element was not found.");
        }

        // Create our single interpreter instance. It handles its own lexer and parser.
        this.interpreter = new Interpreter(outputElement, commandElement);

        this.setupEventListeners(commandElement);
        this.interpreter.log("My-BASIC 1.0 (AST Edition)");
        this.interpreter.log("Ready");
    }

    private setupEventListeners(commandElement: HTMLElement): void {
        commandElement.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const inputText = commandElement.textContent || '';
                
                // The App's only job is to pass the user's text to the interpreter.
                // The interpreter will handle the logic of whether it's a command
                // or input for a prompt.
                this.interpreter.handleUserInput(inputText);
                
                // We clear the input line AFTER the interpreter has handled it.
                // The interpreter will handle blurring/focusing.
                commandElement.textContent = '';
            }
        });
    }
}

// Start the application safely
window.addEventListener('DOMContentLoaded', () => {
    try {
        new App();
    } catch (e) {
        console.error(e);
        document.body.innerHTML = `<div style="color:white;font-family:monospace;padding:10px;">${(e as Error).message}</div>`;
    }
});