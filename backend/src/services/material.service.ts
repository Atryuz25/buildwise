import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MaterialService {
  /**
   * Recalculates the 7-day burn rate for a material
   */
  static async recalculateBurnRate(materialId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const audits = await prisma.auditItem.findMany({
      where: {
        materialId,
        audit: {
          date: {
            gte: sevenDaysAgo,
          },
        },
      },
    });

    const totalUsed = audits.reduce((sum, item) => sum + item.actualUsed, 0);
    const burnRate7Day = totalUsed / 7;

    await prisma.material.update({
      where: { id: materialId },
      data: { burnRate7Day },
    });

    return burnRate7Day;
  }

  /**
   * Deducts stock and triggers warnings if below threshold
   */
  static async deductStock(materialId: string, amount: number) {
    const material = await prisma.material.update({
      where: { id: materialId },
      data: {
        currentStock: {
          decrement: amount,
        },
      },
    });

    if (material.currentStock < material.minThreshold) {
      // Trigger BullMQ job to send WhatsApp warning to PM
      console.warn(`CRITICAL: Material ${material.name} is below threshold!`);
      // queue.add('sendWhatsAppAlert', { materialId, projectId: material.projectId });
    }

    await this.recalculateBurnRate(materialId);

    return material;
  }

  /**
   * Adds new delivery to stock
   */
  static async addDelivery(materialId: string, amount: number, invoiceRef: string) {
    // In reality, we'd log the invoiceRef to a Deliveries table.
    return prisma.material.update({
      where: { id: materialId },
      data: {
        currentStock: {
          increment: amount,
        },
      },
    });
  }
}
