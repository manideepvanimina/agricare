import type { StoredScanReport } from "@workspace/db";

type ScanInput = {
  crop: "Rice" | "Tomato" | "Cotton" | "Chilli" | "Maize" | "Wheat" | "Groundnut" | "Potato" | "Other";
  demoScenario?: "auto" | "rice-fungal" | "tomato-leaf" | "cotton-pest" | "healthy" | "low-confidence";
  symptoms?: string;
  notes?: string;
  imagePath?: string | null;
};

const scenarios = {
  "rice-fungal": {
    crop: "Rice",
    disease: "Possible rice blast",
    scientificName: "Magnaporthe oryzae",
    confidence: 76,
    severity: "Moderate",
    affectedPart: "Leaf",
    alternatives: ["Brown spot", "Nutrient stress"],
    explanation:
      "This is a simulated example of leaf lesions that can be associated with rice blast. A photo was not analyzed, so this is not a diagnosis.",
    likelyFactors: ["High humidity in this demo weather scenario"],
    possibleFactors: ["Leaf wetness", "Dense planting"],
    confirmFactors: ["Check lesion shape and nearby plants with a local crop advisor"],
    actionsNow: [
      "Inspect several plants across the field and note whether similar symptoms are present.",
      "Keep affected plants and tools separate while you seek local guidance.",
    ],
    actions48Hours: [
      "Recheck marked plants and nearby rows in 24–48 hours.",
      "If symptoms are spreading, contact a state agricultural extension worker.",
    ],
    actions7Days: [
      "Record the field area affected and compare with a follow-up photo.",
      "Review drainage and avoid unnecessary leaf wetness where practical.",
    ],
    avoid: [
      "Do not apply a chemical based only on this simulated result.",
      "If chemical control is considered, follow the product label and local agricultural guidance.",
    ],
    monitor: ["New lesions", "Spread to nearby plants", "Changes after rain or irrigation"],
    prevention: [
      "Use locally recommended resistant varieties and field practices.",
      "Remove volunteer plants or crop residues only when local guidance recommends it.",
    ],
    riskScore: 74,
    riskLevel: "High",
    riskOutlook:
      "Risk may rise if humid, wet conditions continue; this is an illustrative estimate.",
    temperatureC: 27,
    humidityPercent: 86,
    rainfallMm: 5.2,
    windKph: 8,
    weatherFactors: ["High humidity (demo)", "Recent rainfall (demo)"],
  },
  "tomato-leaf": {
    crop: "Tomato",
    disease: "Possible early blight",
    scientificName: "Alternaria solani",
    confidence: 72,
    severity: "Moderate",
    affectedPart: "Lower leaves",
    alternatives: ["Septoria leaf spot", "Nutrient stress"],
    explanation:
      "This is a simulated example of a tomato leaf problem. The selected photo is not analyzed by a live vision model.",
    likelyFactors: ["Recent rainfall in this demo weather scenario"],
    possibleFactors: ["Leaf wetness", "Older lower leaves"],
    confirmFactors: ["Check whether spots have concentric rings and ask a local crop advisor"],
    actionsNow: [
      "Inspect the lower and nearby leaves on several plants.",
      "Avoid moving wet plant material between healthy and affected rows.",
    ],
    actions48Hours: [
      "Recheck affected plants after the leaves have dried.",
      "Ask a local extension worker to confirm the cause before treatment.",
    ],
    actions7Days: [
      "Track whether symptoms are appearing on new growth.",
      "Review airflow, plant spacing and irrigation practices.",
    ],
    avoid: [
      "Do not use a pesticide based only on this simulated result.",
      "If chemical control is considered, follow the product label and local agricultural guidance.",
    ],
    monitor: ["New spots", "Yellowing around lesions", "Spread after rain"],
    prevention: [
      "Keep field records and remove crop debris only in line with local guidance.",
      "Avoid unnecessary wetting of foliage where practical.",
    ],
    riskScore: 68,
    riskLevel: "High",
    riskOutlook:
      "Risk could increase if wet conditions persist; this estimate is not a forecast.",
    temperatureC: 29,
    humidityPercent: 78,
    rainfallMm: 8.4,
    windKph: 10,
    weatherFactors: ["Recent rainfall (demo)", "Elevated humidity (demo)"],
  },
  "cotton-pest": {
    crop: "Cotton",
    disease: "Possible insect feeding damage",
    scientificName: "Cause not confirmed",
    confidence: 61,
    severity: "Low",
    affectedPart: "Leaf edges",
    alternatives: ["Mechanical damage", "Other leaf-feeding insects"],
    explanation:
      "This is a simulated example of leaf damage, not an insect identification. The photo was not analyzed.",
    likelyFactors: ["Leaf-feeding damage in this demo scenario"],
    possibleFactors: ["Insect activity", "Weather stress"],
    confirmFactors: ["Look for insects or fresh feeding marks and consult a local crop advisor"],
    actionsNow: [
      "Check the underside of leaves on multiple plants for insects or eggs.",
      "Record how many plants show fresh damage before taking action.",
    ],
    actions48Hours: [
      "Repeat the field check and compare with the marked plants.",
      "Ask an extension worker to identify any pest before choosing control measures.",
    ],
    actions7Days: [
      "Continue scouting at consistent points in the field.",
      "Use locally recommended integrated pest management guidance.",
    ],
    avoid: [
      "Do not spray based only on a simulated example.",
      "If chemical control is considered, follow the product label and local agricultural guidance.",
    ],
    monitor: ["Live insects", "Fresh feeding marks", "Change in the number of affected plants"],
    prevention: [
      "Keep scouting records and protect beneficial insects where appropriate.",
      "Use locally recommended integrated pest management practices.",
    ],
    riskScore: 42,
    riskLevel: "Medium",
    riskOutlook:
      "Further scouting is more useful than predicting spread from this example.",
    temperatureC: 30,
    humidityPercent: 63,
    rainfallMm: 1.2,
    windKph: 12,
    weatherFactors: ["Weather values are illustrative demo data"],
  },
  healthy: {
    crop: "Rice",
    disease: "No clear disease pattern in this demo",
    scientificName: "Not applicable",
    confidence: 88,
    severity: "Low",
    affectedPart: "No affected part indicated",
    alternatives: ["Early symptoms may not be visible in a field check"],
    explanation:
      "This healthy-crop example is simulated. It does not assess the uploaded photo or confirm that the crop is disease-free.",
    likelyFactors: [],
    possibleFactors: ["Symptoms may be too early or not visible in this example"],
    confirmFactors: ["Continue routine field checks and compare with healthy plants"],
    actionsNow: ["Continue routine scouting across the field."],
    actions48Hours: ["Recheck if new symptoms appear or conditions change."],
    actions7Days: ["Keep a simple record of crop condition and field observations."],
    avoid: ["Do not treat a crop based on this simulated healthy example."],
    monitor: ["New spots, wilting, unusual discoloration or pest activity"],
    prevention: [
      "Follow locally recommended seed, sanitation and irrigation practices.",
    ],
    riskScore: 17,
    riskLevel: "Low",
    riskOutlook: "No elevated risk is shown by this demo example.",
    temperatureC: 26,
    humidityPercent: 59,
    rainfallMm: 0,
    windKph: 7,
    weatherFactors: ["Weather values are illustrative demo data"],
  },
} as const;

function lowConfidenceExample(crop: string, symptoms: string, notes: string): StoredScanReport {
  return {
    crop,
    disease: "Unclear leaf symptoms",
    scientificName: "Undetermined",
    confidence: 38,
    severity: "Unclear",
    affectedPart: "Unable to determine",
    symptoms,
    notes,
    alternatives: ["Fungal issue", "Nutrient stress", "Physical damage"],
    explanation:
      "There is not enough evidence to identify the cause. This low-confidence result is a simulated example and the photo was not analyzed.",
    likelyFactors: [],
    possibleFactors: ["Several different causes can produce similar symptoms"],
    confirmFactors: ["Take a clear, well-lit photo and ask a qualified local crop advisor"],
    actionsNow: [
      "Do not treat based on this unclear example.",
      "Inspect multiple plants and note where symptoms first appeared.",
    ],
    actions48Hours: [
      "Take another clear photo of the affected area and a healthy comparison plant.",
      "Consult an agricultural extension worker if symptoms are severe or spreading.",
    ],
    actions7Days: ["Keep monitoring and record any change in affected plants."],
    avoid: [
      "Avoid chemical treatment until the cause is confirmed.",
      "If chemical control is considered, follow the product label and local agricultural guidance.",
    ],
    monitor: ["Whether symptoms spread", "New symptoms", "Pests on the underside of leaves"],
    prevention: ["Maintain routine scouting and follow region-specific crop advice."],
    riskScore: 36,
    riskLevel: "Medium",
    riskOutlook:
      "The outlook is uncertain because the cause is unclear; this is not a forecast.",
    timeline: [
      { label: "Now", detail: "Cause is unclear in this demo example.", riskLevel: "Medium" },
      { label: "24–48 hours", detail: "Recheck the same plants.", riskLevel: "Medium" },
      { label: "3–7 days", detail: "Risk depends on verified cause and field conditions.", riskLevel: "Medium" },
      { label: "7+ days", detail: "Seek local advice if symptoms persist or spread.", riskLevel: "Medium" },
    ],
    weather: {
      source: "demo",
      temperatureC: 27,
      humidityPercent: 68,
      rainfallMm: 1.5,
      windKph: 8,
      factors: ["Illustrative demo weather; not live conditions"],
    },
    analysisSource: "demo",
    imagePath: null,
  };
}

export function createDemoReport(input: ScanInput): StoredScanReport {
  const scenario = input.demoScenario ?? "auto";
  const selected =
    scenario === "auto"
      ? input.crop === "Rice"
        ? "rice-fungal"
        : input.crop === "Tomato"
          ? "tomato-leaf"
          : input.crop === "Cotton"
            ? "cotton-pest"
            : "low-confidence"
      : scenario;

  if (selected === "low-confidence") {
    return lowConfidenceExample(input.crop, input.symptoms?.trim() ?? "", input.notes?.trim() ?? "");
  }

  if (selected === "healthy") {
    return {
      crop: input.crop,
      disease: scenarios.healthy.disease,
      scientificName: scenarios.healthy.scientificName,
      confidence: scenarios.healthy.confidence,
      severity: scenarios.healthy.severity,
      affectedPart: scenarios.healthy.affectedPart,
      symptoms: input.symptoms?.trim() ?? "",
      notes: input.notes?.trim() ?? "",
      alternatives: [...scenarios.healthy.alternatives],
      explanation: scenarios.healthy.explanation,
      likelyFactors: [...scenarios.healthy.likelyFactors],
      possibleFactors: [...scenarios.healthy.possibleFactors],
      confirmFactors: [...scenarios.healthy.confirmFactors],
      actionsNow: [...scenarios.healthy.actionsNow],
      actions48Hours: [...scenarios.healthy.actions48Hours],
      actions7Days: [...scenarios.healthy.actions7Days],
      avoid: [...scenarios.healthy.avoid],
      monitor: [...scenarios.healthy.monitor],
      prevention: [...scenarios.healthy.prevention],
      riskScore: scenarios.healthy.riskScore,
      riskLevel: scenarios.healthy.riskLevel,
      riskOutlook: scenarios.healthy.riskOutlook,
      timeline: [
        { label: "Now", detail: "No clear issue shown in this demo.", riskLevel: "Low" },
        { label: "24–48 hours", detail: "Continue routine observation.", riskLevel: "Low" },
        { label: "3–7 days", detail: "Recheck if conditions change.", riskLevel: "Low" },
        { label: "7+ days", detail: "Use field observations and local guidance.", riskLevel: "Low" },
      ],
      weather: weatherFor(scenarios.healthy),
      analysisSource: "demo",
      imagePath: null,
    };
  }

  const record = scenarios[selected];
  if (record.crop !== input.crop) {
    return lowConfidenceExample(input.crop, input.symptoms?.trim() ?? "", input.notes?.trim() ?? "");
  }

  return {
    crop: record.crop,
    disease: record.disease,
    scientificName: record.scientificName,
    confidence: record.confidence,
    severity: record.severity,
    affectedPart: record.affectedPart,
    symptoms: input.symptoms?.trim() ?? "",
    notes: input.notes?.trim() ?? "",
    alternatives: [...record.alternatives],
    explanation: record.explanation,
    likelyFactors: [...record.likelyFactors],
    possibleFactors: [...record.possibleFactors],
    confirmFactors: [...record.confirmFactors],
    actionsNow: [...record.actionsNow],
    actions48Hours: [...record.actions48Hours],
    actions7Days: [...record.actions7Days],
    avoid: [...record.avoid],
    monitor: [...record.monitor],
    prevention: [...record.prevention],
    riskScore: record.riskScore,
    riskLevel: record.riskLevel,
    riskOutlook: record.riskOutlook,
    timeline: [
      { label: "Now", detail: "Simulated example only; compare with field observations.", riskLevel: record.riskLevel },
      { label: "24–48 hours", detail: "Risk may change if symptoms or conditions change.", riskLevel: record.riskLevel },
      { label: "3–7 days", detail: "Potential spread depends on confirmed cause and field conditions.", riskLevel: record.riskLevel },
      { label: "7+ days", detail: "Reassess after local guidance and follow-up checks.", riskLevel: record.riskLevel },
    ],
    weather: weatherFor(record),
    analysisSource: "demo",
    imagePath: null,
  };
}

function weatherFor(record: {
  temperatureC: number;
  humidityPercent: number;
  rainfallMm: number;
  windKph: number;
  weatherFactors: readonly string[];
}) {
  return {
    source: "demo",
    temperatureC: record.temperatureC,
    humidityPercent: record.humidityPercent,
    rainfallMm: record.rainfallMm,
    windKph: record.windKph,
    factors: [...record.weatherFactors],
  };
}

export function demoWeatherSnapshot() {
  return {
    source: "demo" as const,
    temperatureC: 27,
    humidityPercent: 68,
    rainfallMm: 1.5,
    windKph: 8,
    factors: ["Illustrative demo weather; not live conditions"],
  };
}
