import { createInsertSchema } from "drizzle-zod";
import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export type StoredScanReport = {
  crop: string;
  disease: string;
  scientificName: string;
  confidence: number;
  severity: string;
  affectedPart: string;
  symptoms: string;
  notes: string;
  alternatives: string[];
  explanation: string;
  likelyFactors: string[];
  possibleFactors: string[];
  confirmFactors: string[];
  actionsNow: string[];
  actions48Hours: string[];
  actions7Days: string[];
  avoid: string[];
  monitor: string[];
  prevention: string[];
  riskScore: number;
  riskLevel: string;
  riskOutlook: string;
  timeline: Array<{ label: string; detail: string; riskLevel: string }>;
  weather: {
    source: string;
    temperatureC: number;
    humidityPercent: number;
    rainfallMm: number;
    windKph: number;
    factors: string[];
  };
  analysisSource: string;
  imagePath: string | null;
};

export const scansTable = pgTable(
  "agrishield_scans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id").notNull(),
    crop: text("crop").notNull(),
    disease: text("disease").notNull(),
    confidence: integer("confidence").notNull(),
    severity: text("severity").notNull(),
    riskScore: integer("risk_score").notNull(),
    riskLevel: text("risk_level").notNull(),
    imagePath: text("image_path"),
    report: jsonb("report").$type<StoredScanReport>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("agrishield_scans_owner_created_idx").on(table.ownerId, table.createdAt),
    index("agrishield_scans_owner_risk_idx").on(table.ownerId, table.riskScore),
  ],
);

export const insertScanSchema = createInsertSchema(scansTable).omit({
  id: true,
  createdAt: true,
});
export type InsertScan = z.infer<typeof insertScanSchema>;
export type ScanRow = typeof scansTable.$inferSelect;
