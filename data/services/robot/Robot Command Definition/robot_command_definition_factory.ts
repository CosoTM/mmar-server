import { RobotCommandDefinition } from "./robot_command_definiton";

export function createMoveJointsCommand(
    jointCount: number,
    unit: "degrees" | "radians",
) : RobotCommandDefinition {
    return {
        commandName: "moveJoints",
        description: "Move the joints of the robot to the specified angles",
        parameters: [
            {
                name: "angles",
                type: "number[]",
                required: true,
                description: "An array of angles for each joint of the robot",
                constraints: {
                    minItems: jointCount,
                    maxItems: jointCount,
                    unit: unit
                }
            }
        ]
    }
}

export function createGetJointsCommand(): RobotCommandDefinition {
    return {
        commandName: "getJoints",
        description: "Get the current angles of the robot joints",
        parameters: []
    }
}