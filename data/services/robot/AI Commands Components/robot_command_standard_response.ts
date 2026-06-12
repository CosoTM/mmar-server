export interface RobotCommandStandardResponse {
    operation: string;
    // Type is "unknown" and not "any", so that we are forced to check the actual type before using it.
    parameters: Record<string, unknown>;
}