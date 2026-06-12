import { RobotCommandParameter } from "./robot_command_parameter";

export interface RobotCommandDefinition{
    commandName: string;
    description: string;
    parameters: RobotCommandParameter[];
}