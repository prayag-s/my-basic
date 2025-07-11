// src/environment.ts

export class Environment {
    // We use a Map for efficient lookups, insertions, and deletions.
    private variables: Map<string, string | number> = new Map();

    public set(name: string, value: string | number): void {
        // Variable names in BASIC are case-insensitive, so we always store them uppercase.
        this.variables.set(name.toUpperCase(), value);
    }

    public get(name: string): string | number {
        const key = name.toUpperCase();
        if (!this.variables.has(key)) {
            // In classic BASIC, referencing an unassigned numeric variable returns 0,
            // and an unassigned string variable returns an empty string "".
            if (key.endsWith('$')) {
                return "";
            } else {
                return 0;
            }
        }
        return this.variables.get(key)!;
    }

    public clear(): void {
        this.variables.clear();
    }
}