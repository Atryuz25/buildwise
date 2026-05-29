export interface CutRequest {
  length: number;
  quantity: number;
  label?: string;
}

export interface Rod {
  standardLength: number;
  usedLength: number;
  remainingLength: number;
  cuts: CutRequest[];
}

export interface OptimizationResult {
  totalRodsNeeded: number;
  rods: Rod[];
  totalScrap: number;
  scrapPercentage: number;
}

/**
 * Implements the First Fit Decreasing (FFD) algorithm for the 1D cutting stock problem
 */
export function optimizeSteelCuts(standardLength: number, cuts: CutRequest[]): OptimizationResult {
  // Flatten cuts based on quantity
  const flatCuts: CutRequest[] = [];
  for (const cut of cuts) {
    for (let i = 0; i < cut.quantity; i++) {
      flatCuts.push({ length: cut.length, quantity: 1, label: cut.label });
    }
  }

  // 1. Sort cuts in decreasing order of length
  flatCuts.sort((a, b) => b.length - a.length);

  const rods: Rod[] = [];

  // 2. First Fit Decreasing allocation
  for (const cut of flatCuts) {
    if (cut.length > standardLength) {
      throw new Error(`Cut length ${cut.length} exceeds standard rod length ${standardLength}`);
    }

    let placed = false;
    for (const rod of rods) {
      if (rod.remainingLength >= cut.length) {
        rod.cuts.push(cut);
        rod.usedLength += cut.length;
        rod.remainingLength -= cut.length;
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Open a new rod
      rods.push({
        standardLength,
        usedLength: cut.length,
        remainingLength: standardLength - cut.length,
        cuts: [cut],
      });
    }
  }

  const totalRodsNeeded = rods.length;
  const totalMaterialProvided = totalRodsNeeded * standardLength;
  let totalScrap = 0;

  for (const rod of rods) {
    totalScrap += rod.remainingLength;
  }

  const scrapPercentage = totalMaterialProvided > 0 ? (totalScrap / totalMaterialProvided) * 100 : 0;

  return {
    totalRodsNeeded,
    rods,
    totalScrap,
    scrapPercentage,
  };
}
