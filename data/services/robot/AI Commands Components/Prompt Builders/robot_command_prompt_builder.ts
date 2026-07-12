import { Robot } from "../../../../../../mmar-global-data-structure"
import { RobotCommandDefinition } from "../../Robot Command Definition/robot_command_definiton"
import { RobotCommandStandardResponse } from "../robot_command_standard_response"

export function buildRobotCommandPrompt(
    selectedRobot: Robot,
    supportedCommands: RobotCommandDefinition[],
    userRequest: string
): string{
    const successOutput: RobotCommandStandardResponse ={
        status: "command",
        operation: "operation_name",
        parameters: {
            "parameter_name": "parameter_value",
        }
    }

    const failOutput: RobotCommandStandardResponse = {
        status: "no_understanding",
        message: "message explaining the misunderstanding"
    }

    const prompt = [
        "You are a precise robot command interpreter.",
        "Your task is to convert a natural language user request into a structured robot operation.",
        "You will be given the selected robot, the commands that the robot supports, the desired output formats and the user request.",
        "You will follow the following rules:",
        "- Use only the operations listed in the supported commands.",
        "- Do not invent any operation under any circumstance.",
        "- Do not invent missing parameters.",
        "- Do not generate robot-specific commands. Follow the output format strictly.",
        "- Only return valid JSON; Do not include explanations, markdown, or code fences.",
        "If a command parameter expects a fixed-size collection and the user provides less values but the user clearly wants them to apply to more elements of the collection, expand the values to the required collection size",
        "Selected robot:",
        JSON.stringify({
            uuid: selectedRobot.get_uuid(),
            name: selectedRobot.get_name(),
            type: selectedRobot.get_robotType()
        }),
        "Supported commands:",
        JSON.stringify(supportedCommands),
        "If the request can be mapped to a supported command successfully, return:",
        JSON.stringify(successOutput, null, 2),
        "If the request is ambigous or lacks required parameters, return:",
        JSON.stringify(failOutput, null, 2),
        "User request:",
        userRequest
    ].join("\n")

    return prompt
}

export function buildTestPrompt(
    supportedCommands: RobotCommandDefinition[],
    userRequest: string
): string{
    const exampleOutput: RobotCommandStandardResponse ={
        status: "command",
        operation: "operation_name",
        parameters: {
            "parameter_name": "parameter_value",
        }
    }

    const prompt = [
        "You are a robot for testing validations",
        "You will be given the commands that the robot supports, the desired output format and the user request.",
        "Your objective is to actually not give out the precise format I will give you.",
        "You will give out a structured format, but built wrong.",
        "This is to test if the validation steps we built are working correctly in the case of an actual response we want correct.",
        "Only return JSON; Do not include explanations, markdown, or code fences.",
        "Invent a new operation that doesnt exists",
        "Supported commands:",
        JSON.stringify(supportedCommands),
        "Desired output format:",
        JSON.stringify(exampleOutput, null, 2),
        "User request:",
        userRequest
    ].join("\n")

    return prompt
}