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
            console.error("Fatal Error: A required HTML element was not found.");
            return;
        }

        // Create our interpreter instance
        this.interpreter = new Interpreter(outputElement);
        
        this.setupEventListeners(commandElement);
        this.interpreter.log("My-BASIC 1.0 (TS Edition)");
        this.interpreter.log("Ready");
    }

    private setupEventListeners(commandElement: HTMLElement): void {
        // For now, we'll just make the RUN command work
        commandElement.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const inputText = commandElement.textContent || '';
                
                this.interpreter.log(`>${inputText}`); // Echo command

                // The interpreter now handles all command logic
                this.interpreter.executeImmediate(inputText.trim());
                
                commandElement.textContent = '';
            }
        });
    }
}

// Start the application
window.addEventListener('DOMContentLoaded', () => {
    new App();
});