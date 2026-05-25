/**
 * Knowledge Graph — simple entity & relation storage in SQLite.
 *
 * Entities are extracted from memory content (people, concepts, tools, places).
 * Relations connect two entities with a typed edge.
 */
// ---------------------------------------------------------------------------
// GraphStore
// ---------------------------------------------------------------------------
export class GraphStore {
    db;
    constructor(db) {
        this.db = db;
    }
    initialize() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS entities (
        id           TEXT PRIMARY KEY,
        name         TEXT NOT NULL UNIQUE,
        entity_type  TEXT NOT NULL DEFAULT 'concept',
        metadata     TEXT NOT NULL DEFAULT '{}',
        created_at   TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name);
      CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);

      CREATE TABLE IF NOT EXISTS relations (
        id            TEXT PRIMARY KEY,
        source_id     TEXT NOT NULL REFERENCES entities(id),
        target_id     TEXT NOT NULL REFERENCES entities(id),
        relation_type TEXT NOT NULL DEFAULT 'related_to',
        weight        REAL NOT NULL DEFAULT 1.0,
        metadata      TEXT NOT NULL DEFAULT '{}',
        created_at    TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_relations_source ON relations(source_id);
      CREATE INDEX IF NOT EXISTS idx_relations_target ON relations(target_id);
      CREATE INDEX IF NOT EXISTS idx_relations_type  ON relations(relation_type);
    `);
    }
    // -----------------------------------------------------------------------
    // Entities
    // -----------------------------------------------------------------------
    upsertEntity(name, entityType = "concept", metadata = {}) {
        const existing = this.db.prepare("SELECT id FROM entities WHERE name = ?").get(name);
        if (existing) {
            this.db
                .prepare("UPDATE entities SET metadata = ?, entity_type = ? WHERE id = ?")
                .run(JSON.stringify(metadata), entityType, existing.id);
            return existing.id;
        }
        const id = crypto.randomUUID();
        this.db
            .prepare("INSERT INTO entities (id, name, entity_type, metadata) VALUES (?, ?, ?, ?)")
            .run(id, name, entityType, JSON.stringify(metadata));
        return id;
    }
    getEntity(name) {
        const row = this.db.prepare("SELECT * FROM entities WHERE name = ?").get(name);
        if (!row)
            return undefined;
        return { ...row, metadata: safeJsonParse(row.metadata, {}) };
    }
    // -----------------------------------------------------------------------
    // Relations
    // -----------------------------------------------------------------------
    upsertRelation(sourceName, targetName, relationType = "related_to", weight = 1.0, metadata = {}) {
        const sourceId = this.upsertEntity(sourceName);
        const targetId = this.upsertEntity(targetName);
        // Check for existing relation in either direction
        const existing = this.db
            .prepare("SELECT id FROM relations WHERE source_id = ? AND target_id = ? AND relation_type = ?")
            .get(sourceId, targetId, relationType);
        if (existing) {
            this.db
                .prepare("UPDATE relations SET weight = weight + ?, metadata = ? WHERE id = ?")
                .run(weight, JSON.stringify(metadata), existing.id);
            return existing.id;
        }
        const id = crypto.randomUUID();
        this.db
            .prepare("INSERT INTO relations (id, source_id, target_id, relation_type, weight, metadata) VALUES (?, ?, ?, ?, ?, ?)")
            .run(id, sourceId, targetId, relationType, weight, JSON.stringify(metadata));
        return id;
    }
    // -----------------------------------------------------------------------
    // Queries
    // -----------------------------------------------------------------------
    /** Get entities connected to a given entity (by name) */
    getConnected(name) {
        const entity = this.getEntity(name);
        if (!entity)
            return [];
        const outRels = this.db
            .prepare("SELECT * FROM relations WHERE source_id = ?")
            .all(entity.id);
        const inRels = this.db
            .prepare("SELECT * FROM relations WHERE target_id = ?")
            .all(entity.id);
        const results = [];
        for (const rel of outRels) {
            const target = this.db.prepare("SELECT * FROM entities WHERE id = ?").get(rel.target_id);
            if (target) {
                results.push({
                    entity: { ...target, metadata: safeJsonParse(target.metadata, {}) },
                    relationType: rel.relation_type,
                    direction: "out",
                });
            }
        }
        for (const rel of inRels) {
            const source = this.db.prepare("SELECT * FROM entities WHERE id = ?").get(rel.source_id);
            if (source) {
                results.push({
                    entity: { ...source, metadata: safeJsonParse(source.metadata, {}) },
                    relationType: rel.relation_type,
                    direction: "in",
                });
            }
        }
        return results;
    }
    // -----------------------------------------------------------------------
    // Stats
    // -----------------------------------------------------------------------
    stats() {
        const entities = this.db.prepare("SELECT COUNT(*) AS c FROM entities").get().c;
        const relations = this.db.prepare("SELECT COUNT(*) AS c FROM relations").get().c;
        const byEntityRows = this.db.prepare("SELECT entity_type, COUNT(*) AS c FROM entities GROUP BY entity_type").all();
        const byEntityType = {};
        for (const r of byEntityRows)
            byEntityType[r.entity_type] = r.c;
        const byRelRows = this.db.prepare("SELECT relation_type, COUNT(*) AS c FROM relations GROUP BY relation_type").all();
        const byRelationType = {};
        for (const r of byRelRows)
            byRelationType[r.relation_type] = r.c;
        return { entities, relations, byEntityType, byRelationType };
    }
    // -----------------------------------------------------------------------
    // Reset
    // -----------------------------------------------------------------------
    reset() {
        this.db.exec("DELETE FROM relations; DELETE FROM entities;");
    }
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function safeJsonParse(raw, fallback) {
    try {
        return JSON.parse(raw);
    }
    catch {
        return fallback;
    }
}
//# sourceMappingURL=graph.js.map