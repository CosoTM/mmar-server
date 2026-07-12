import { JointAngle } from "../../../../../mmar-global-data-structure/models/robot/Robot Data Objects/joints_angle";
import { RobotType } from "../../../../../mmar-global-data-structure/models/robot/Robot_type";
import { RobotBaseResolver } from "../Command Resolvers/Robot_base_resolver";
import ai_standard_response_validator from "./ai_standard_response_validator";
import { RobotCommandResponse, RobotCommandStandardResponse } from "./robot_command_standard_response";
import { plainToInstance } from "class-transformer";

export function dispatchCommand(
    response: RobotCommandResponse,
    resolver: RobotBaseResolver<RobotType>
): string {
    ai_standard_response_validator.isCommandSupported(response, resolver.getSupportedCommands())

    switch(response.operation){
        case "moveJoints": {
            const angles: JointAngle = ai_standard_response_validator.validateMoveJointsCommand(resolver, response)
            return resolver.moveJoints(angles);
        }
        case "getJoints": {
            return resolver.getJointPose()
        }
        default: { 
            throw new Error("Unsupported operation."); 
        }
    }
}