import { RequestHandler } from "express"
import { database_connection } from "../..";
import { Robot } from "../../../mmar-global-data-structure";
import { filter_object } from "../../data/services/middleware/object_filter";
import {
    BaseError,
    HTTP500Error,
    HTTP403NORIGHT,
    HTTP409CONFLICT
} from "../../data/services/middleware/error_handling/standard_errors.middleware";

import Metamodel_Robot_connection from "../../data/Robot.connection";


/**
 * @classdesc - This class is used to handle all the 'management' requests for the meta robots.
 * @export - The class is exported so that it can be used by other files.
 * @class - Metamodel_Robot_controller
 */
class Metamodel_Robot_controller {
    /**
     * @description - Defines a new Robot with the given UUID using the data provided in the request body.
     */
    post_define_robot: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            // From the request body, we get the plain JavaScript object and we
            // transform it directly into an instance of the Robot class.
            // https://github.com/typestack/class-transformer?tab=readme-ov-file#plaintoinstance
            const newRobotData = Robot.fromJS(req.body) as Robot;
            console.log("Received new Robot data: ", newRobotData);
            newRobotData.uuid = req.params.uuid;

            // We call the "create" method from the connection class. If everything in connection
            // goes well, we should get back the created Robot instance.
            const sc = await Metamodel_Robot_connection.create(
                client,
                newRobotData,
                req.body.tokendata.uuid
            );

            // We check what we got back from the connection. If it's a Robot instance, then
            // everything went well and we can return a 201 status with the created Robot...
            if (sc instanceof Robot) {
                res.status(201).json(filter_object(sc, req.query.filter));
                // ...else, if we got back an error, we throw it so that it can be handled.
            } else if (sc instanceof BaseError) {
                throw sc;
                // else, if something unexected happened, we throw a generic 500 error.
            } else {
                throw new HTTP500Error(
                    `Cannot post the robot ${req.params.uuid}.`
                );
            }
            res.status(201).json(newRobotData)
            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            next(error);
        } finally {
            (await client).release();
        }
    };

    /**
     * @description - Retrieves a Robot from the DB using the given UUID.
     */
    get_robot_by_uuid: RequestHandler = async (req, res, next) =>{
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");

            // Given the UUID in the request, we try and retrieve the Robot that corresponds to 
            // that UUID from the DB.
            const sc = await Metamodel_Robot_connection.getByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );

            // If what we got back is actually a Robot instance, we return it to the client.
            if (sc instanceof Robot) {
                res.status(200).json(filter_object(sc, req.query.filter));
                await client.query("COMMIT");
            // Else, if we got back an error, we throw it so that it can be handled.
            } else if (sc instanceof BaseError) {
                throw sc
            } else {
                throw new HTTP500Error(
                    `Failed to retrieve the robot ${req.params.uuid}.`
                );
            }
        } catch (err) {
            await client.query("ROLLBACK");
            next(err);
        } finally {
            (await client).release();
        }
    }   

    /**
     * @description - Deletes the Robot corresponding to the given UUID from the DB. 
     */
    // TODO: fix. Doesnt work and dont know why
    delete_robot_by_uuid: RequestHandler = async (req, res, next) => {
        const client = await database_connection.getPool().connect();

        try {
            await client.query("BEGIN");
            // Given the UUID in the request, we try and delete the Robot that corresponds to 
            // that UUID from the DB.
            const sc = await Metamodel_Robot_connection.deleteByUuid(
                client,
                req.params.uuid,
                req.body.tokendata.uuid
            );

            
            if (Array.isArray(sc)) {
                //The result does not contains any uuid, i.e. the metaobject is not linked to any instance
                res.status(200).json(sc);
            } else if (sc instanceof BaseError) {
                throw sc;
            } else {
                throw new HTTP500Error(
                    `Cannot delete the robot ${req.params.uuid}.`
                );
            }
            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            if (error instanceof HTTP403NORIGHT) res.status(403).json(error.message);
            if (error instanceof HTTP500Error) res.status(500).json(error.message);
            if (error instanceof HTTP409CONFLICT) res.status(409).json(error.message);
            next(error);
        }finally {
            (await client).release();
        }
    };
}

export default new Metamodel_Robot_controller();