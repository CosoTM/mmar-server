/* export interface RobotCommandStandardResponse {
    status: "command" | "no_understanding"
    operation: string;
    // Type is "unknown" and not "any", so that we are forced to check the actual type before using it.
    parameters?: Record<string, unknown>;
    message?: string
} */

export interface RobotCommandResponse {
    status: "command";
    operation: string;
    parameters: Record<string, unknown>;
}

export interface RobotNoUnderstandingResponse {
    status: "no_understanding";
    message: string
}

export type RobotCommandStandardResponse = RobotCommandResponse | RobotNoUnderstandingResponse
