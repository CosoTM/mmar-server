export interface RobotCommandParameter{
    name: string;
    type: "number" | "string" | "boolen" | "number[]";
    required: boolean;
    description?: string;
    constraints?: {
        min?: number;
        max?: number;
        minItems?: number;
        maxItems?: number;
        unit?: string;
    };
}