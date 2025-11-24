import { JointAngle } from "../../../../../mmar-global-data-structure/models/robot/Robot Data Objects/joints_angle";
import { RobotType } from "../../../../../mmar-global-data-structure/models/robot/Robot_type";
import { RobotBaseResolver } from "./Robot_base_resolver";
export class RobotDobotE6SimResolver extends RobotBaseResolver<typeof RobotType.DOBOT_E6_SIM> {
    public readonly jointNumber: number = 6;
    public readonly forType = RobotType.DOBOT_E6_SIM;

    moveToPoint(x: number, y: number, z: number, rx: number, ry: number, rz: number): string {
        throw new Error("Method not implemented.");
    }
    moveJoints(angles: JointAngle): string {
        return  `moveJ(${angles.joints.join(',')})`;
    }
    getJointPose(): string {
        return 'getJoints()'
    }
    parseReply(data: string) {
        return JSON.parse(data)
    }
    parseFeedbackData(data: string) {
        throw new Error("Method not implemented.");
    }

}