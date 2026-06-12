import { PoolClient } from "pg";
import { UUID } from "../../../mmar-global-data-structure";
import { CRUD } from "../common/crud.interface";
import { BaseError } from "../services/middleware/error_handling/standard_errors.middleware";

class Metamodel_actionsConnection implements CRUD{
    getByUuid: (client: PoolClient, uuidToGet: UUID)=> Promise<any | undefined | BaseError>;    
    getAllByParentUuid: (client: PoolClient, uuidParent: UUID) => Promise<any[] | BaseError>;
    create: (client: PoolClient, objectToCreate: any) => Promise<any | undefined | BaseError>;
    update: (client: PoolClient, uuidToUpdate: UUID, objectToUpdate: any) => Promise<any | undefined | BaseError>;
    deleteByUuid: (client: PoolClient, uuidToDelete: UUID) => Promise<UUID[] | undefined | BaseError>;

}