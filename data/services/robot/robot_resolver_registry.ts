import { RobotBaseResolver } from "./Command Resolvers/Robot_base_resolver";
import { RobotType } from "../../../../mmar-global-data-structure/models/robot/Robot_type";
import {
    HTTP500Error,
    BaseError
} from "../middleware/error_handling/standard_errors.middleware";

export class RobotResolverRegistry {
    private readonly resolverMap: Map<RobotType, RobotBaseResolver<RobotType>>;

    constructor(resolvers:RobotBaseResolver<RobotType>[] = []) {
        // For each element on the given array of resolvers, we return a tuple
        // containing the RobotType handled by the resolver, and the resolver itself 
        this.resolverMap = new Map(resolvers.map(rs => [rs.forType, rs]));
    }

    getResolver(robot_type:RobotType): RobotBaseResolver<RobotType>|BaseError{
        const rs = this.resolverMap.get(robot_type)
        if (!rs) return new HTTP500Error(`No Resolver found for the specified Robot Type. Are you sure the Robot type '${robot_type}' exists?`);
        return rs;
    }
}