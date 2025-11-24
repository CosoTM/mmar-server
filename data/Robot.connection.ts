import { PoolClient } from "pg";
import { Metamodel, Robot, UUID } from "../../mmar-global-data-structure";
import { CRUD } from "./common/crud.interface";
import { BaseError, HTTP403NORIGHT } from "./services/middleware/error_handling/standard_errors.middleware";
import Metamodel_metaobject_connection from "./meta/Metamodel_metaobjects.connection";
import { queries } from "..";
import { cli } from "winston/lib/winston/config";

class Metamodel_robotConnection implements CRUD {
    async getByUuid(
        client: PoolClient,
        robotUUID: UUID,
        userUUID?: UUID
    ): Promise<Robot | undefined | BaseError> {
        try {
            const getRobotQuery = `SELECT * FROM metaobject m, robot_properties r WHERE m.uuid = r.uuid_robot AND r.uuid_robot = $1`;
            let newRobot;

            if (userUUID) {
                const read_check = queries.getQuery_get("read_check");
                const res = await client.query(read_check, [robotUUID, userUUID]);
                if (res.rowCount == 0) {
                    return new HTTP403NORIGHT(
                        `The user ${userUUID} has no right to read the class ${robotUUID}`,
                    );
                }
            }

            const robotRes = await client.query(getRobotQuery, [robotUUID]);
            if (robotRes.rowCount == 1)
                newRobot = Robot.fromJS(robotRes.rows[0]) as Robot;
            
            return newRobot;
        } catch (error) {
            throw new Error(`Error getting the robot with uuid ${robotUUID}: ${error}`);
        }
    }

    getAllByParentUuid: (client: PoolClient, uuidParent: UUID) => Promise<any[] | BaseError>;

    async create(
        client: PoolClient,
        newRobot: Robot,
        userUuid?: UUID
    ): Promise<Robot | undefined | BaseError> {
        try {
            // This is just the query to create the robot-specific properties.
            const createRobotQuery = `INSERT INTO robot_properties (uuid_robot, ip_address, command_port, feedback_port, robot_type) values ($1, $2, $3, $4, $5)`;

            // A robot is also a metaobject, so we also create the "metaobject" part of it first.
            const created_metaObject = await Metamodel_metaobject_connection.create(
                client,
                newRobot,
                userUuid,
                "robot"
            );

            // If created_metaObject is an error, something went wrong during the creation of the 
            // metaobject part, so we return the error.
            if (created_metaObject instanceof BaseError) {
                // If the error is specificallt a 403, or "no right" error, we return a specific message.
                if (created_metaObject.httpCode === 403) {
                    return new HTTP403NORIGHT(
                        `The user ${userUuid} has no right to create the class`,
                    );
                }
                return created_metaObject;
            }

            // if created_metaObject is undefined, we just return undefined.
            if (!created_metaObject) return undefined;

            // if created_metaObject has been created succesfully, we can now create the "robot" part.
            await client.query(createRobotQuery, [
                created_metaObject.get_uuid(),
                newRobot.get_ipAddress(),
                newRobot.get_CommandPort(),
                newRobot.get_FeedbackPort(),
                newRobot.get_robotType()
            ]);

            await this.update(client, created_metaObject.get_uuid(), newRobot);
            return await this.getByUuid(
                client,
                created_metaObject.get_uuid(),
                userUuid,
            );
        } catch (error) {
            throw new Error(`Error creating the robot: ${error}`);
        }
    }

    async update(
        client: PoolClient,
        robotUUIDToUpdate: UUID,
        newRobot: Robot,
        userUUID?: UUID
    ): Promise<Robot | undefined | BaseError> {
        try {
            const updateRobotQuery = `UPDATE robot_properties SET ip_address = $1, command_port = $2, feedback_port = $3, robot_type = $4 WHERE uuid_robot = $5`;

            const updated_metaobj = await Metamodel_metaobject_connection.update(
                client,
                robotUUIDToUpdate,
                newRobot,
                userUUID,
            );

            if (updated_metaobj instanceof BaseError) {
                if (updated_metaobj.httpCode === 403) {
                    return new HTTP403NORIGHT(
                        `The user ${userUUID} has no right to update the class ${robotUUIDToUpdate}`,
                    );
                }
                return updated_metaobj;
            }
            if (!updated_metaobj) return undefined;

            await client.query(updateRobotQuery, [
                newRobot.get_ipAddress(),
                newRobot.get_CommandPort(),
                newRobot.get_FeedbackPort(),
                newRobot.get_robotType(),
                updated_metaobj.get_uuid()
            ]);

            return await this.getByUuid(
                client,
                robotUUIDToUpdate,
                userUUID
            );
        } catch (error) {
            throw new Error(`Error updating the robot ${robotUUIDToUpdate}: ${error}`);
        }
    }

    async deleteByUuid(
        client: PoolClient,
        UUIDToDelete: UUID,
        userUUID?: UUID
    ): Promise<UUID[] | undefined | BaseError> {
        try {
            const deleteRobot = `DELETE FROM robot_properties WHERE uuid_robot=$1`
            const test = await client.query(deleteRobot, [
                UUIDToDelete
            ])

            // console.log(test)

            const returned = await Metamodel_metaobject_connection.deleteByUuid(
                client,
                UUIDToDelete,
                userUUID
            );
            return returned

        } catch (error) {
            throw new Error(`Error deleting the robot ${UUIDToDelete}: ${error}`);
        }
    }
}

export default new Metamodel_robotConnection();