import { getAuth } from "@clerk/express";
import { and, count, desc, eq } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  CreateScanBody,
  CreateScanResponse,
  DeleteScanParams,
  GetDashboardResponse,
  GetScanParams,
  GetScanResponse,
  ListAlertsResponse,
  ListScansResponse,
} from "@workspace/api-zod";
import { db, scansTable, type ScanRow } from "@workspace/db";
import { createDemoReport, demoWeatherSnapshot } from "../lib/demoDiagnosis";

const router: IRouter = Router();

function getFarmerId(req: Request, res: Response): string | null {
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Sign in to access your crop records." });
    return null;
  }
  return userId;
}

function toScan(row: ScanRow) {
  return GetScanResponse.parse({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    ...(row.report as Record<string, unknown>),
  });
}

function alertsFrom(scans: ScanRow[]) {
  return ListAlertsResponse.parse(
    scans
      .filter((scan) => scan.riskScore >= 65 || scan.confidence < 50)
      .slice(0, 5)
      .map((scan) => ({
        id: `scan-${scan.id}`,
        title:
          scan.confidence < 50
            ? "Follow-up inspection recommended"
            : "Elevated demo risk estimate",
        detail:
          scan.confidence < 50
            ? "This simulated result is unclear. Take a new field photo and consider checking with a local agricultural officer."
            : "This is a simulated risk signal, not a live alert. Inspect affected plants and verify the result with local guidance.",
        level: scan.confidence < 50 ? "watch" : scan.riskScore >= 80 ? "urgent" : "watch",
        createdAt: scan.createdAt.toISOString(),
        scanId: scan.id,
      })),
  );
}

router.get("/dashboard", async (req, res): Promise<void> => {
  const farmerId = getFarmerId(req, res);
  if (!farmerId) return;

  const [recent, [totals]] = await Promise.all([
    db
      .select()
      .from(scansTable)
      .where(eq(scansTable.ownerId, farmerId))
      .orderBy(desc(scansTable.createdAt))
      .limit(6),
    db
      .select({ total: count() })
      .from(scansTable)
      .where(eq(scansTable.ownerId, farmerId)),
  ]);

  const latest = recent[0];
  const recentScans = recent.map(toScan);
  const latestRisk = latest?.riskScore ?? 0;
  const healthScore = latest ? Math.max(0, 100 - latestRisk) : null;
  const healthLabel = !latest
    ? "No estimate yet"
    : latestRisk >= 75
      ? "Needs attention"
      : latestRisk >= 45
        ? "Keep watching"
        : "No elevated demo risk";

  res.json(
    GetDashboardResponse.parse({
      healthLabel,
      healthScore,
      currentRisk: latest?.riskLevel ?? "Not assessed",
      totalScans: totals?.total ?? 0,
      weather: latest?.report.weather ?? demoWeatherSnapshot(),
      recentScans,
      alerts: alertsFrom(recent),
    }),
  );
});

router.get("/scans", async (req, res): Promise<void> => {
  const farmerId = getFarmerId(req, res);
  if (!farmerId) return;

  const scans = await db
    .select()
    .from(scansTable)
    .where(eq(scansTable.ownerId, farmerId))
    .orderBy(desc(scansTable.createdAt))
    .limit(100);

  res.json(ListScansResponse.parse(scans.map(toScan)));
});

router.post("/scans", async (req, res): Promise<void> => {
  const farmerId = getFarmerId(req, res);
  if (!farmerId) return;

  const parsed = CreateScanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Check the crop details and try again." });
    return;
  }

  const report = createDemoReport(parsed.data);
  const [row] = await db
    .insert(scansTable)
    .values({
      ownerId: farmerId,
      crop: report.crop,
      disease: report.disease,
      confidence: report.confidence,
      severity: report.severity,
      riskScore: report.riskScore,
      riskLevel: report.riskLevel,
      imagePath: null,
      report,
    })
    .returning();

  res.status(201).json(CreateScanResponse.parse(toScan(row)));
});

router.get("/scans/:scanId", async (req, res): Promise<void> => {
  const farmerId = getFarmerId(req, res);
  if (!farmerId) return;

  const params = GetScanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid scan identifier." });
    return;
  }

  const [scan] = await db
    .select()
    .from(scansTable)
    .where(and(eq(scansTable.id, params.data.scanId), eq(scansTable.ownerId, farmerId)))
    .limit(1);

  if (!scan) {
    res.status(404).json({ error: "Scan not found." });
    return;
  }

  res.json(GetScanResponse.parse(toScan(scan)));
});

router.delete("/scans/:scanId", async (req, res): Promise<void> => {
  const farmerId = getFarmerId(req, res);
  if (!farmerId) return;

  const params = DeleteScanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid scan identifier." });
    return;
  }

  const [deleted] = await db
    .delete(scansTable)
    .where(and(eq(scansTable.id, params.data.scanId), eq(scansTable.ownerId, farmerId)))
    .returning({ id: scansTable.id });

  if (!deleted) {
    res.status(404).json({ error: "Scan not found." });
    return;
  }
  res.sendStatus(204);
});

router.get("/alerts", async (req, res): Promise<void> => {
  const farmerId = getFarmerId(req, res);
  if (!farmerId) return;

  const recent = await db
    .select()
    .from(scansTable)
    .where(eq(scansTable.ownerId, farmerId))
    .orderBy(desc(scansTable.createdAt))
    .limit(20);

  res.json(alertsFrom(recent));
});

export default router;
