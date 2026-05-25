/**
 * Knowledge Graph — simple entity & relation storage in SQLite.
 *
 * Entities are extracted from memory content (people, concepts, tools, places).
 * Relations connect two entities with a typed edge.
 */
import type Database from "better-sqlite3";
export interface Entity {
    id: string;
    name: string;
    entity_type: string;
    metadata: Record<string, unknown>;
    created_at: string;
}
export interface Relation {
    id: string;
    source_id: string;
    target_id: string;
    relation_type: string;
    weight: number;
    metadata: Record<string, unknown>;
    created_at: string;
}
export interface GraphStats {
    entities: number;
    relations: number;
    byEntityType: Record<string, number>;
    byRelationType: Record<string, number>;
}
export declare class GraphStore {
    private db;
    constructor(db: Database.Database);
    initialize(): void;
    upsertEntity(name: string, entityType?: string, metadata?: Record<string, unknown>): string;
    getEntity(name: string): Entity | undefined;
    upsertRelation(sourceName: string, targetName: string, relationType?: string, weight?: number, metadata?: Record<string, unknown>): string;
    /** Get entities connected to a given entity (by name) */
    getConnected(name: string): Array<{
        entity: Entity;
        relationType: string;
        direction: "in" | "out";
    }>;
    stats(): GraphStats;
    reset(): void;
}
//# sourceMappingURL=graph.d.ts.map