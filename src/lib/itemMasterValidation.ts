import ExcelJS from 'exceljs';

// ============================================================================
// Type Definitions
// ============================================================================

export type RuleId =
  | "INV_COST_MISSING"
  | "EXP_ITEM_WITH_INVENTORY_COST"
  | "UOM_MISMATCH"
  | "ITEM_CLASS_INVALID"
  | "ORPHAN_ITEM_SITE";

export type IssueSeverity = "low" | "medium" | "high";

export interface ValidationIssue {
  site?: string;              // e.g. "MHP"
  item_number: string;        // e.g. "N10003"
  item_description?: string;  // from ITMENT
  rule_id: RuleId;
  severity: IssueSeverity;
  message: string;            // human-readable description
  suggested_fix?: string;     // optional recommended action
}

export interface ValidationStats {
  total_items: number;        // distinct item numbers in ITMENT
  total_item_sites: number;   // distinct (site, item) pairs considered
  total_sites: number;
  total_issues: number;
  issues_by_rule: Record<RuleId, number>;
  issues_by_severity: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface ValidationResult {
  summary: string;            // a short text summary
  stats: ValidationStats;
  issues: ValidationIssue[];
}

// ============================================================================
// Internal Data Models
// ============================================================================

interface ItemSite {
  // Global fields from ITMENT
  itemNumber: string;
  itemDescription?: string;
  stockingUOM?: string;
  
  // Site fields from ITMRVA
  site: string;
  inventoryFlag: number;  // 1 = inventory, 0 = non-inventory
  siteUOM?: string;
  itemClass?: string;
  
  // Cost fields from ITMRVB
  standardUnitCost?: number;
  currentUnitCost?: number;
}

interface ITMENTRow {
  itemNumber: string;
  itemDescription?: string;
  stockingUOM?: string;
}

interface ITMRVARow {
  site: string;
  itemNumber: string;
  inventoryFlag: number;
  siteUOM?: string;
  itemClass?: string;
}

interface ITMRVBRow {
  site: string;
  itemNumber: string;
  standardUnitCost?: number;
  currentUnitCost?: number;
}

// ============================================================================
// Constants
// ============================================================================

const ALLOWED_ITEM_CLASSES = ["FG", "RM", "PKG", "WIP", "EXP"] as const;

// ============================================================================
// Excel Reading Utilities
// ============================================================================

/**
 * Normalizes header names by trimming and handling common variations
 */
function normalizeHeader(header: string): string {
  return header.trim();
}

/**
 * Finds column index by header name (case-insensitive, handles trailing spaces)
 */
function findColumnIndex(
  row: ExcelJS.Row,
  headerName: string
): number | null {
  const normalizedTarget = normalizeHeader(headerName);
  for (let i = 1; i <= row.cellCount; i++) {
    const cell = row.getCell(i);
    if (cell.value && typeof cell.value === 'string') {
      if (normalizeHeader(cell.value) === normalizedTarget) {
        return i;
      }
    }
  }
  return null;
}

/**
 * Gets cell value as string, handling null/undefined
 */
function getCellString(cell: ExcelJS.Cell): string | undefined {
  if (!cell.value) return undefined;
  if (typeof cell.value === 'string') return cell.value.trim();
  return String(cell.value).trim();
}

/**
 * Gets cell value as number, handling null/undefined/empty
 */
function getCellNumber(cell: ExcelJS.Cell): number | undefined {
  if (!cell.value) return undefined;
  if (typeof cell.value === 'number') return cell.value;
  const parsed = parseFloat(String(cell.value));
  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Reads ITMENT sheet (global item master)
 */
async function readITMENT(
  worksheet: ExcelJS.Worksheet
): Promise<Map<string, ITMENTRow>> {
  const items = new Map<string, ITMENTRow>();
  
  if (worksheet.rowCount < 2) return items; // No data rows
  
  const headerRow = worksheet.getRow(1);
  const itemNumberCol = findColumnIndex(headerRow, "Item number");
  const itemDescCol = findColumnIndex(headerRow, "Item description");
  const stockingUOMCol = findColumnIndex(headerRow, "Stocking unit of measure");
  
  if (!itemNumberCol) {
    throw new Error("ITMENT sheet missing 'Item number' column");
  }
  
  for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const itemNumber = getCellString(row.getCell(itemNumberCol));
    
    if (!itemNumber) continue; // Skip rows without item number
    
    items.set(itemNumber, {
      itemNumber,
      itemDescription: itemDescCol ? getCellString(row.getCell(itemDescCol)) : undefined,
      stockingUOM: stockingUOMCol ? getCellString(row.getCell(stockingUOMCol)) : undefined,
    });
  }
  
  return items;
}

/**
 * Reads ITMRVA sheet (item attributes by site)
 */
async function readITMRVA(
  worksheet: ExcelJS.Worksheet
): Promise<Map<string, ITMRVARow>> {
  const siteItems = new Map<string, ITMRVARow>();
  
  if (worksheet.rowCount < 2) return siteItems;
  
  const headerRow = worksheet.getRow(1);
  const siteCol = findColumnIndex(headerRow, "Site identifier");
  const itemNumberCol = findColumnIndex(headerRow, "Item number");
  const inventoryFlagCol = findColumnIndex(headerRow, "Inventory flag");
  const siteUOMCol = findColumnIndex(headerRow, "Unit of measure");
  const itemClassCol = findColumnIndex(headerRow, "Item class");
  
  if (!siteCol || !itemNumberCol || !inventoryFlagCol) {
    throw new Error("ITMRVA sheet missing required columns (Site identifier, Item number, Inventory flag)");
  }
  
  for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const site = getCellString(row.getCell(siteCol));
    const itemNumber = getCellString(row.getCell(itemNumberCol));
    const inventoryFlagValue = getCellNumber(row.getCell(inventoryFlagCol));
    
    if (!site || !itemNumber || inventoryFlagValue === undefined) continue;
    
    const key = `${site}|${itemNumber}`;
    siteItems.set(key, {
      site,
      itemNumber,
      inventoryFlag: Math.round(inventoryFlagValue), // Ensure integer
      siteUOM: siteUOMCol ? getCellString(row.getCell(siteUOMCol)) : undefined,
      itemClass: itemClassCol ? getCellString(row.getCell(itemClassCol)) : undefined,
    });
  }
  
  return siteItems;
}

/**
 * Reads ITMRVB sheet (item costs by site)
 * For duplicate (site, item) pairs, picks the first encountered row
 */
async function readITMRVB(
  worksheet: ExcelJS.Worksheet
): Promise<Map<string, ITMRVBRow>> {
  const siteCosts = new Map<string, ITMRVBRow>();
  
  if (worksheet.rowCount < 2) return siteCosts;
  
  const headerRow = worksheet.getRow(1);
  const siteCol = findColumnIndex(headerRow, "Site identifier");
  const itemNumberCol = findColumnIndex(headerRow, "Item number");
  const standardCostCol = findColumnIndex(headerRow, "Standard unit cost");
  const currentCostCol = findColumnIndex(headerRow, "Current unit cost");
  
  if (!siteCol || !itemNumberCol) {
    throw new Error("ITMRVB sheet missing required columns (Site identifier, Item number)");
  }
  
  for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const site = getCellString(row.getCell(siteCol));
    const itemNumber = getCellString(row.getCell(itemNumberCol));
    
    if (!site || !itemNumber) continue;
    
    const key = `${site}|${itemNumber}`;
    
    // Only set if not already present (first row wins)
    if (!siteCosts.has(key)) {
      siteCosts.set(key, {
        site,
        itemNumber,
        standardUnitCost: standardCostCol ? getCellNumber(row.getCell(standardCostCol)) : undefined,
        currentUnitCost: currentCostCol ? getCellNumber(row.getCell(currentCostCol)) : undefined,
      });
    }
  }
  
  return siteCosts;
}

/**
 * Builds ItemSite array by joining ITMENT, ITMRVA, and ITMRVB
 */
function buildItemSiteArray(
  itment: Map<string, ITMENTRow>,
  itmrva: Map<string, ITMRVARow>,
  itmrvb: Map<string, ITMRVBRow>
): ItemSite[] {
  const itemSites: ItemSite[] = [];
  
  // Start from ITMRVA (site-level attributes)
  for (const [key, rva] of itmrva.entries()) {
    const [site, itemNumber] = key.split('|');
    const globalItem = itment.get(itemNumber);
    const costRow = itmrvb.get(key);
    
    itemSites.push({
      itemNumber,
      itemDescription: globalItem?.itemDescription,
      stockingUOM: globalItem?.stockingUOM,
      site,
      inventoryFlag: rva.inventoryFlag,
      siteUOM: rva.siteUOM,
      itemClass: rva.itemClass,
      standardUnitCost: costRow?.standardUnitCost,
      currentUnitCost: costRow?.currentUnitCost,
    });
  }
  
  return itemSites;
}

// ============================================================================
// Validation Rules
// ============================================================================

/**
 * Rule 1: INV_COST_MISSING
 * Inventory item without any cost
 */
function applyInvCostMissing(items: ItemSite[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  for (const item of items) {
    if (
      item.inventoryFlag === 1 &&
      (!item.standardUnitCost || item.standardUnitCost === 0) &&
      (!item.currentUnitCost || item.currentUnitCost === 0)
    ) {
      issues.push({
        site: item.site,
        item_number: item.itemNumber,
        item_description: item.itemDescription,
        rule_id: "INV_COST_MISSING",
        severity: "high",
        message: `Inventory item has inventory flag = 1 but both standard and current unit costs are 0 at site ${item.site}.`,
        suggested_fix: "Confirm the correct standard/current cost for this inventory item and update ITMRVB.",
      });
    }
  }
  
  return issues;
}

/**
 * Rule 2: EXP_ITEM_WITH_INVENTORY_COST
 * Non-inventory (expensed) item that still carries inventory cost
 */
function applyExpItemWithInventoryCost(items: ItemSite[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  for (const item of items) {
    if (
      item.inventoryFlag === 0 &&
      ((item.standardUnitCost && item.standardUnitCost > 0) ||
       (item.currentUnitCost && item.currentUnitCost > 0))
    ) {
      issues.push({
        site: item.site,
        item_number: item.itemNumber,
        item_description: item.itemDescription,
        rule_id: "EXP_ITEM_WITH_INVENTORY_COST",
        severity: "high",
        message: `Non-inventory (expensed) item has non-zero cost at site ${item.site}. This may indicate double-counting between expense and inventory.`,
        suggested_fix: "Review whether this item should be inventory (flag = 1) or if the cost should be removed from ITMRVB.",
      });
    }
  }
  
  return issues;
}

/**
 * Rule 3: UOM_MISMATCH
 * Unit of measure inconsistent between global and site-level
 */
function applyUOMMismatch(items: ItemSite[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  for (const item of items) {
    const globalUOM = item.stockingUOM?.trim().toUpperCase();
    const siteUOM = item.siteUOM?.trim().toUpperCase();
    
    if (
      globalUOM &&
      siteUOM &&
      globalUOM !== siteUOM
    ) {
      issues.push({
        site: item.site,
        item_number: item.itemNumber,
        item_description: item.itemDescription,
        rule_id: "UOM_MISMATCH",
        severity: "medium",
        message: `Global stocking UOM is '${item.stockingUOM}' but site-level UOM is '${item.siteUOM}' for this item. Procurement and finance may value quantities differently.`,
        suggested_fix: "Align the unit of measure between ITMENT (global) and ITMRVA (site-level) to ensure consistent quantity/value calculations.",
      });
    }
  }
  
  return issues;
}

/**
 * Rule 4: ITEM_CLASS_INVALID
 * Item class missing or not in standard list
 */
function applyItemClassInvalid(items: ItemSite[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  for (const item of items) {
    const itemClass = item.itemClass?.trim().toUpperCase();
    
    if (!itemClass || !ALLOWED_ITEM_CLASSES.includes(itemClass as any)) {
      const classDisplay = item.itemClass || '(empty)';
      issues.push({
        site: item.site,
        item_number: item.itemNumber,
        item_description: item.itemDescription,
        rule_id: "ITEM_CLASS_INVALID",
        severity: "medium",
        message: `Item class is '${classDisplay}', which is not in the standard list [${ALLOWED_ITEM_CLASSES.join(', ')}]. Misclassification may cause incorrect GL roll-up.`,
        suggested_fix: `Update the item class in ITMRVA to one of: ${ALLOWED_ITEM_CLASSES.join(', ')}.`,
      });
    }
  }
  
  return issues;
}

/**
 * Rule 5: ORPHAN_ITEM_SITE
 * Site-level records without corresponding global item master record
 */
function applyOrphanItemSite(
  items: ItemSite[],
  globalItemNumbers: Set<string>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  for (const item of items) {
    if (!globalItemNumbers.has(item.itemNumber)) {
      issues.push({
        site: item.site,
        item_number: item.itemNumber,
        item_description: item.itemDescription,
        rule_id: "ORPHAN_ITEM_SITE",
        severity: "high",
        message: `Item ${item.itemNumber} exists at site ${item.site} (attributes or cost) but is missing from the global item master (ITMENT). This breaks end-to-end traceability.`,
        suggested_fix: "Add this item to ITMENT with the required global fields (Item number, Item description, Stocking unit of measure).",
      });
    }
  }
  
  return issues;
}

// ============================================================================
// Statistics Calculation
// ============================================================================

/**
 * Calculates validation statistics from issues and data
 */
function calculateStats(
  issues: ValidationIssue[],
  globalItemNumbers: Set<string>,
  itemSites: ItemSite[]
): ValidationStats {
  const sites = new Set<string>();
  const itemSitePairs = new Set<string>();
  
  for (const item of itemSites) {
    sites.add(item.site);
    itemSitePairs.add(`${item.site}|${item.itemNumber}`);
  }
  
  const issuesByRule: Record<RuleId, number> = {
    INV_COST_MISSING: 0,
    EXP_ITEM_WITH_INVENTORY_COST: 0,
    UOM_MISMATCH: 0,
    ITEM_CLASS_INVALID: 0,
    ORPHAN_ITEM_SITE: 0,
  };
  
  const issuesBySeverity = {
    low: 0,
    medium: 0,
    high: 0,
  };
  
  for (const issue of issues) {
    issuesByRule[issue.rule_id]++;
    issuesBySeverity[issue.severity]++;
  }
  
  return {
    total_items: globalItemNumbers.size,
    total_item_sites: itemSitePairs.size,
    total_sites: sites.size,
    total_issues: issues.length,
    issues_by_rule: issuesByRule,
    issues_by_severity: issuesBySeverity,
  };
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validates a Curium-style Item Master Excel workbook
 * 
 * @param workbookBuffer - Excel workbook as ArrayBuffer or Buffer
 * @returns ValidationResult with issues and statistics
 */
export async function validateItemMaster(
  workbookBuffer: ArrayBuffer | Buffer
): Promise<ValidationResult> {
  const workbook = new ExcelJS.Workbook();
  
  // ExcelJS.load accepts Buffer or ArrayBuffer, but TypeScript types are strict
  // Convert ArrayBuffer to Buffer if needed
  let buffer: Buffer;
  if (workbookBuffer instanceof Buffer) {
    buffer = workbookBuffer;
  } else {
    buffer = Buffer.from(new Uint8Array(workbookBuffer)) as Buffer;
  }
  
  await workbook.xlsx.load(buffer as any);
  
  // Read sheets
  const itmentSheet = workbook.getWorksheet('ITMENT');
  const itmrvaSheet = workbook.getWorksheet('ITMRVA');
  const itmrvbSheet = workbook.getWorksheet('ITMRVB');
  
  if (!itmentSheet) {
    throw new Error("Workbook missing required sheet: ITMENT");
  }
  if (!itmrvaSheet) {
    throw new Error("Workbook missing required sheet: ITMRVA");
  }
  if (!itmrvbSheet) {
    throw new Error("Workbook missing required sheet: ITMRVB");
  }
  
  // Read data
  const itment = await readITMENT(itmentSheet);
  const itmrva = await readITMRVA(itmrvaSheet);
  const itmrvb = await readITMRVB(itmrvbSheet);
  
  // Build global item number set for orphan detection
  const globalItemNumbers = new Set(itment.keys());
  
  // Build ItemSite array
  const itemSites = buildItemSiteArray(itment, itmrva, itmrvb);
  
  // Apply all validation rules
  const allIssues: ValidationIssue[] = [
    ...applyInvCostMissing(itemSites),
    ...applyExpItemWithInventoryCost(itemSites),
    ...applyUOMMismatch(itemSites),
    ...applyItemClassInvalid(itemSites),
    ...applyOrphanItemSite(itemSites, globalItemNumbers),
  ];
  
  // Calculate statistics
  const stats = calculateStats(allIssues, globalItemNumbers, itemSites);
  
  // Generate summary
  const summary = `Validation completed: ${stats.total_issues} issues found across ${stats.total_item_sites} item-site combinations.`;
  
  return {
    summary,
    stats,
    issues: allIssues,
  };
}

