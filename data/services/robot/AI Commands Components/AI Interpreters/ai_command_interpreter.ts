import { RobotCommandStandardResponse } from "../robot_command_standard_response";

export interface AICommandInterpreter {
  
  interpret(prompt: string): Promise<RobotCommandStandardResponse>;
}