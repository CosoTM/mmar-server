import { RequestHandler } from "express"
import { database_connection } from "../";
import { Robot } from "../../mmar-global-data-structure";
import {
    BaseError,
    HTTP500Error,
} from "../data/services/middleware/error_handling/standard_errors.middleware";

import Metamodel_Robot_connection from "../data/Robot.connection";

import WebSocketManager from '../data/services/websocket_logic/websocket_manager'
import { RobotTest1Resolver } from "../data/services/robot/Command Resolvers/Robot_test1_resolver";
import { RobotTest2Resolver } from "../data/services/robot/Command Resolvers/Robot_test2_resolver";
import { RobotDobotE6SimResolver } from "../data/services/robot/Command Resolvers/Robot_DobotE6Sim_resolver";
import { RobotResolverRegistry } from "../data/services/robot/robot_resolver_registry";
import { plainToInstance } from "class-transformer";
import { JointAngle } from "../../mmar-global-data-structure/models/robot/Robot Data Objects/joints_angle";

/**
 * @classdesc This class is used to handle all the requests concerning commands and status updates of robots via WebSockets.
 * @export - The class is exported so that it can be used by other files.
 * @class Robot_socket_controller
 */
class Robot_socket_controller {
    // Robot Resolver Registry instance to retrieve the correct Resolver for each Robot Type.
    resolverRegistry = new RobotResolverRegistry([
            new RobotTest1Resolver,
            new RobotTest2Resolver,
            new RobotDobotE6SimResolver
        ]
    )

    /**
     * @description - Retrieves a Robot using the given UUID and then connects to a it via a WebSocket.
     */
    connect_robot_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            // We retrieve the Robot from the DB via UUID.
            const sc = await Metamodel_Robot_connection.getByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );

            // If what we get back is actually a Robot instance, we proceed.
            if (sc instanceof Robot) {
                // Check in the Socket Manager if a socket to the Robot URL is already opened or not.
                // In any case, if everything goes well, we return the WebSocket instance.
                const socket = await WebSocketManager.getConnection(sc.get_ipAddress(), sc.get_CommandPort())

                // We check if what we got back is actually a WebSocket Instance becuase, if its not, we 
                // throw the error that is returned.
                if (socket instanceof BaseError) throw socket

                // It is not specified if the connection was just created or if it was already present, but
                // this shouldnt matter for the client.
                res.status(200).json("Socket Connected with " + sc.get_ipAddress());
            }
            else if (sc instanceof BaseError) throw sc
            else throw new HTTP500Error(`Failed to move the robot ${req.params.uuid}.`);
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    }

    /**
     * @description - Retrieves a Robot using the given UUID, connects to it via WebSocket and sends the command to get the current joints pose. 
     */
    get_robot_joints_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            // We retrieve the Robot from the DB via UUID.
            const sc = await Metamodel_Robot_connection.getByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );

            // If what we get back is actually a Robot instance, we proceed.
            if (sc instanceof Robot) {
                // With the Robot Type of the Robot we just got, we retrieve the correct Resolver to build the command.
                const resolver = this.resolverRegistry.getResolver(sc.get_robotType())

                // If we dont get back a Resolver, a wrong Robot Type was sent to the registry.
                if(resolver instanceof BaseError) throw resolver

                // We try to connect to the Robot and send the commands to get the joint pose of the Robot Arm.
                const response = await WebSocketManager.connectAndSend(
                    sc.get_ipAddress(), 
                    sc.get_CommandPort(), 
                    resolver.getJointPose()
                )

                // If the response is an error or undefined, something went wrong either with the connection or with sendind the command.
                if (response instanceof BaseError) throw response
                if (!response) throw new HTTP500Error(`Failed to get joints of the robot ${req.params.uuid}.`);

                res.status(200).json(resolver.parseReply(response))
            }
            else if (sc instanceof BaseError) throw sc
            else throw new HTTP500Error(`Failed to get joints of the robot ${req.params.uuid}.`);
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    }

    /**
     * @description - Retrieves a Robot using the given UUID, connects to it via WebSocket and sends the command to move all its joints depending on the given Joint values in the request. 
     */
    move_robot_joints_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            // We retrieve the Robot from the DB via UUID.
            const sc = await Metamodel_Robot_connection.getByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );

            // We transform the request body into a 'JointAngle' instance.
            const jnts = plainToInstance(JointAngle, req.body)
            
            // If what we get back is actually a Robot instance, we proceed.
            // TODO: check jnts validity
            if (sc instanceof Robot) {
                // With the Robot Type of the Robot we just got, we retrieve the correct Resolver to build the command.
                const resolver = this.resolverRegistry.getResolver(sc.get_robotType())

                // If we dont get back a Resolver, a wrong Robot Type was sent to the registry.
                if(resolver instanceof BaseError) throw resolver

                // If the number of joints that were requested to be moved is different from the number of joints
                // that the targated Robot has, we throw an error.
                if(resolver.jointNumber !== jnts.joints.length) // TODO: Should this check be directly inside the Resolvers? 
                    throw new HTTP500Error(`The request wants to move ${jnts.joints.length} joints, but the targeted robot has ${resolver.jointNumber}`)

                // We try to connect to the Robot and send the commands to move the joint pose of the Robot Arm.
                const response = await WebSocketManager.connectAndSend(
                    sc.get_ipAddress(), 
                    sc.get_CommandPort(), 
                    resolver.moveJoints(jnts)
                )
                
                if (response instanceof BaseError) throw response
                if (!response) throw new HTTP500Error(`Failed to get joints of the robot ${req.params.uuid}.`);

                res.status(200).json(resolver.parseReply(response))
            }
            else if (sc instanceof BaseError) throw sc
            else throw new HTTP500Error(`Failed to get joints of the robot ${req.params.uuid}.`);
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    }
}

export default new Robot_socket_controller();