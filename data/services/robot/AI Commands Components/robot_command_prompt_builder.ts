import { Robot } from "../../../../../mmar-global-data-structure"
import { RobotCommandDefinition } from "../Robot Command Definition/robot_command_definiton"
import { RobotCommandStandardResponse } from "./robot_command_standard_response"

export function buildRobotCommandPrompt(
    selectedRobot: Robot,
    supportedCommands: RobotCommandDefinition[],
    userRequest: string
): string{
    const exampleOutput: RobotCommandStandardResponse ={
        operation: "operation_name",
        parameters: {
            "parameter_name": "parameter_value",
        }
    }

    const prompt = [
        "You are a precise robot command interpreter.",
        "Your task is to convert a natural language user request into a structured robot operation.",
        "You will be given the selected robot, the commands that the robot supports, the desired output format and the user request.",
        "You will follow the following rules:",
        "- Use only the operations listed in the supported commands.",
        "- Do not invent any operation under any circumstance.",
        "- Do not invent missing parameters.",
        "- Do not generate robot-specific commands. Follow the output format strictly.",
        "- Only return valid JSON; Do not include explanations, markdown, or code fences.",
        "",
        "Selected robot:",
        JSON.stringify({
            uuid: selectedRobot.get_uuid(),
            name: selectedRobot.get_name(),
            type: selectedRobot.get_robotType()
        }),
        "Supported commands:",
        JSON.stringify(supportedCommands),
        "Desired output format:",
        JSON.stringify(exampleOutput, null, 2),
        "User request:",
        userRequest
    ].join("\n")

    return prompt
}